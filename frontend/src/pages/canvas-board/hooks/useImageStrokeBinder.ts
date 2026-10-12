import { useEffect, useRef } from 'react';

interface UseImageStrokeBinderProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  excalidrawAPI: any | null;
}

/**
 * Automatically groups drawings/strokes and annotations that fall on top of images
 * so they stay bound and move together with the image, matching the classic canvas behavior.
 */
export function useImageStrokeBinder({
  containerRef,
  excalidrawAPI,
}: UseImageStrokeBinderProps) {
  const isBindingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !excalidrawAPI) return;

    const bindStrokesToImages = () => {
      if (isBindingRef.current) return;
      isBindingRef.current = true;

      try {
        const elements = excalidrawAPI.getSceneElements();
        if (!elements || elements.length === 0) return;

        const images = elements.filter(
          (el: any) => el.type === 'image' && !el.isDeleted
        );
        if (images.length === 0) return;

        let hasChanges = false;
        const updatedElements = [...elements];

        // For each image, bind any strokes drawn on its surface
        for (const img of images) {
          const imgLeft = img.x;
          const imgRight = img.x + img.width;
          const imgTop = img.y;
          const imgBottom = img.y + img.height;

          // Stable groupId associated with this image
          const groupId =
            img.groupIds && img.groupIds.length > 0
              ? img.groupIds[0]
              : `grp_img_${img.id}`;

          // Ensure the image has this groupId
          if (!img.groupIds || !img.groupIds.includes(groupId)) {
            const imgIdx = updatedElements.findIndex((el: any) => el.id === img.id);
            if (imgIdx !== -1) {
              updatedElements[imgIdx] = {
                ...updatedElements[imgIdx],
                groupIds: [...(updatedElements[imgIdx].groupIds || []), groupId],
              };
              hasChanges = true;
            }
          }

          // Check all stroke / freedraw / text elements
          for (let i = 0; i < updatedElements.length; i++) {
            const el = updatedElements[i];
            if (
              el.id === img.id ||
              el.isDeleted ||
              (el.groupIds && el.groupIds.includes(groupId))
            ) {
              continue;
            }

            if (
              el.type === 'freedraw' ||
              el.type === 'line' ||
              el.type === 'arrow' ||
              el.type === 'text'
            ) {
              const elCenterX = el.x + el.width / 2;
              const elCenterY = el.y + el.height / 2;

              // Check if center of the stroke is inside image bounds (with 12px margin)
              if (
                elCenterX >= imgLeft - 12 &&
                elCenterX <= imgRight + 12 &&
                elCenterY >= imgTop - 12 &&
                elCenterY <= imgBottom + 12
              ) {
                updatedElements[i] = {
                  ...el,
                  groupIds: [...(el.groupIds || []), groupId],
                };
                hasChanges = true;
              }
            }
          }
        }

        if (hasChanges) {
          excalidrawAPI.updateScene({
            elements: updatedElements,
            commitToHistory: false,
          });
        }
      } catch (err) {
        console.error('Error binding strokes to images:', err);
      } finally {
        isBindingRef.current = false;
      }
    };

    // When the user releases mouse or pen after drawing, bind strokes to the image underneath
    const handlePointerUp = () => {
      requestAnimationFrame(() => {
        bindStrokesToImages();
      });
    };

    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [containerRef, excalidrawAPI]);
}
