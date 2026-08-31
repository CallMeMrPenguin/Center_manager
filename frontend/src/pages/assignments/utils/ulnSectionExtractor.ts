import { UlnNode } from './ulnTypes';
import { UlnSectionItem } from '../types';

/**
 * Extracts distinct exercise/sections from parsed ULN nodes.
 * A section starts at an `ins`, `h1`, `h2`, `h3` heading or before a block of questions.
 */
export function extractUlnSections(nodes: UlnNode[]): UlnSectionItem[] {
  if (!nodes || nodes.length === 0) return [];
  const sections: UlnSectionItem[] = [];
  let currentSection: UlnSectionItem | null = null;
  let currentQCount = 0;
  let currentQNums: string[] = [];

  for (let idx = 0; idx < nodes.length; idx++) {
    const node = nodes[idx];
    const isHeading = node.type === 'ins' || node.type === 'h1' || node.type === 'h2' || node.type === 'h3';

    if (isHeading && 'text' in node && node.text.trim()) {
      if (currentSection) {
        (currentSection as UlnSectionItem).endNodeIndex = idx - 1;
        (currentSection as UlnSectionItem).questionCount = currentQCount;
        (currentSection as UlnSectionItem).questionNumbers = [...currentQNums];
        sections.push(currentSection);
      }
      currentQCount = 0;
      currentQNums = [];
      const cleanTitle = (node.text || '').replace(/^\*\*|\*\*$/g, '').trim();
      currentSection = {
        id: sections.length + 1,
        title: cleanTitle || `Bài tập ${sections.length + 1}`,
        startNodeIndex: idx,
        endNodeIndex: idx,
        questionCount: 0,
        questionNumbers: [],
      };
    } else if (node.type === 'question') {
      if (!currentSection) {
        currentSection = {
          id: 1,
          title: 'Bài tập 1: Khởi động',
          startNodeIndex: 0,
          endNodeIndex: idx,
          questionCount: 0,
          questionNumbers: [],
        };
      }
      currentQCount++;
      if (node.qNum) {
        currentQNums.push(String(node.qNum));
      }
    }
  }

  const finalSec: UlnSectionItem | null = currentSection;
  if (finalSec) {
    finalSec.endNodeIndex = nodes.length - 1;
    finalSec.questionCount = currentQCount;
    finalSec.questionNumbers = [...currentQNums];
    sections.push(finalSec);
  }

  // If no explicit heading found but questions exist, create a default single section
  if (sections.length === 0) {
    const questions = nodes.filter((n) => n.type === 'question');
    if (questions.length > 0) {
      sections.push({
        id: 1,
        title: 'Toàn bộ bài tập',
        startNodeIndex: 0,
        endNodeIndex: nodes.length - 1,
        questionCount: questions.length,
        questionNumbers: questions.map((q) => (q as any).qNum || ''),
      });
    }
  }

  return sections;
}

export interface NodeSectionInfo {
  sectionId: number;
  sectionTitle: string;
  isAssigned: boolean;
}

/**
 * Builds a lookup map from node index to section assignment status.
 * If assignedSections is empty or undefined, all nodes are treated as assigned.
 */
export function getNodeSectionMap(nodes: UlnNode[], assignedSections?: number[]): Map<number, NodeSectionInfo> {
  const map = new Map<number, NodeSectionInfo>();
  if (!nodes || nodes.length === 0) return map;
  const sections = extractUlnSections(nodes);
  const isAllAssigned = !assignedSections || assignedSections.length === 0;
  const assignedSet = new Set(assignedSections || []);

  sections.forEach((sec) => {
    const isAssigned = isAllAssigned || assignedSet.has(sec.id);
    for (let idx = sec.startNodeIndex; idx <= sec.endNodeIndex; idx++) {
      map.set(idx, {
        sectionId: sec.id,
        sectionTitle: sec.title,
        isAssigned,
      });
    }
  });

  return map;
}

/**
 * Backward-compatible helper: returns all nodes when assignedSections is set (viewing full test with gray-out),
 * or filters when explicitly needed.
 */
export function filterNodesByAssignedSections(nodes: UlnNode[], assignedSections?: number[]): UlnNode[] {
  // Always return all nodes so student can see the full exam paper with unassigned parts grayed out
  return nodes || [];
}
