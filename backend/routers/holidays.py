import os
import re
import urllib.request
from typing import Optional, List, Dict, Any
from fastapi import APIRouter

router = APIRouter(tags=["holidays"])

# In-memory cache for fetched Google calendar holidays
_GOOGLE_HOLIDAYS_CACHE: Dict[str, Any] = {
    "year": None,
    "data": [],
    "last_fetched": 0
}

# Standard official Vietnam public holidays (Nghỉ lễ Nhà nước)
OFFICIAL_VN_HOLIDAYS = [
    # 2024
    {"date": "2024-01-01", "name": "Tết Dương lịch", "is_public": True},
    {"date": "2024-02-08", "name": "29 Tết Giáp Thìn", "is_public": True},
    {"date": "2024-02-09", "name": "30 Tết (Giao thừa)", "is_public": True},
    {"date": "2024-02-10", "name": "Mùng 1 Tết Giáp Thìn", "is_public": True},
    {"date": "2024-02-11", "name": "Mùng 2 Tết Giáp Thìn", "is_public": True},
    {"date": "2024-02-12", "name": "Mùng 3 Tết Giáp Thìn", "is_public": True},
    {"date": "2024-02-13", "name": "Mùng 4 Tết Giáp Thìn", "is_public": True},
    {"date": "2024-02-14", "name": "Mùng 5 Tết Giáp Thìn", "is_public": True},
    {"date": "2024-04-18", "name": "Giỗ Tổ Hùng Vương (10/3 AL)", "is_public": True},
    {"date": "2024-04-30", "name": "Ngày Giải phóng Miền Nam", "is_public": True},
    {"date": "2024-05-01", "name": "Quốc tế Lao động", "is_public": True},
    {"date": "2024-09-02", "name": "Quốc khánh nước CHXHCN Việt Nam", "is_public": True},
    {"date": "2024-09-03", "name": "Nghỉ Lễ Quốc khánh", "is_public": True},

    # 2025
    {"date": "2025-01-01", "name": "Tết Dương lịch", "is_public": True},
    {"date": "2025-01-25", "name": "26 Tết Ất Tỵ", "is_public": True},
    {"date": "2025-01-26", "name": "27 Tết Ất Tỵ", "is_public": True},
    {"date": "2025-01-27", "name": "28 Tết Ất Tỵ", "is_public": True},
    {"date": "2025-01-28", "name": "29 Tết (Giao thừa)", "is_public": True},
    {"date": "2025-01-29", "name": "Mùng 1 Tết Ất Tỵ", "is_public": True},
    {"date": "2025-01-30", "name": "Mùng 2 Tết Ất Tỵ", "is_public": True},
    {"date": "2025-01-31", "name": "Mùng 3 Tết Ất Tỵ", "is_public": True},
    {"date": "2025-02-01", "name": "Mùng 4 Tết (Nghỉ Tết)", "is_public": True},
    {"date": "2025-02-02", "name": "Mùng 5 Tết (Nghỉ Tết)", "is_public": True},
    {"date": "2025-04-07", "name": "Giỗ Tổ Hùng Vương (10/3 AL)", "is_public": True},
    {"date": "2025-04-30", "name": "Ngày Giải phóng Miền Nam", "is_public": True},
    {"date": "2025-05-01", "name": "Quốc tế Lao động", "is_public": True},
    {"date": "2025-09-01", "name": "Nghỉ Lễ Quốc khánh", "is_public": True},
    {"date": "2025-09-02", "name": "Quốc khánh nước CHXHCN Việt Nam", "is_public": True},

    # 2026
    {"date": "2026-01-01", "name": "Tết Dương lịch", "is_public": True},
    {"date": "2026-02-14", "name": "27 Tết Bính Ngọ", "is_public": True},
    {"date": "2026-02-15", "name": "28 Tết Bính Ngọ", "is_public": True},
    {"date": "2026-02-16", "name": "29 Tết (Giao thừa)", "is_public": True},
    {"date": "2026-02-17", "name": "Mùng 1 Tết Bính Ngọ", "is_public": True},
    {"date": "2026-02-18", "name": "Mùng 2 Tết Bính Ngọ", "is_public": True},
    {"date": "2026-02-19", "name": "Mùng 3 Tết Bính Ngọ", "is_public": True},
    {"date": "2026-02-20", "name": "Mùng 4 Tết (Nghỉ bù)", "is_public": True},
    {"date": "2026-02-21", "name": "Mùng 5 Tết (Nghỉ bù)", "is_public": True},
    {"date": "2026-02-22", "name": "Mùng 6 Tết (Nghỉ Tết)", "is_public": True},
    {"date": "2026-04-26", "name": "Giỗ Tổ Hùng Vương (10/3 AL)", "is_public": True},
    {"date": "2026-04-27", "name": "Nghỉ bù Giỗ Tổ Hùng Vương", "is_public": True},
    {"date": "2026-04-30", "name": "Ngày Giải phóng Miền Nam", "is_public": True},
    {"date": "2026-05-01", "name": "Quốc tế Lao động", "is_public": True},
    {"date": "2026-09-01", "name": "Nghỉ Lễ Quốc khánh", "is_public": True},
    {"date": "2026-09-02", "name": "Quốc khánh nước CHXHCN Việt Nam", "is_public": True},

    # 2027
    {"date": "2027-01-01", "name": "Tết Dương lịch", "is_public": True},
    {"date": "2027-02-05", "name": "28 Tết Đinh Mùi", "is_public": True},
    {"date": "2027-02-06", "name": "Mùng 1 Tết Đinh Mùi", "is_public": True},
    {"date": "2027-02-07", "name": "Mùng 2 Tết Đinh Mùi", "is_public": True},
    {"date": "2027-02-08", "name": "Mùng 3 Tết Đinh Mùi", "is_public": True},
    {"date": "2027-04-15", "name": "Giỗ Tổ Hùng Vương (10/3 AL)", "is_public": True},
    {"date": "2027-04-30", "name": "Ngày Giải phóng Miền Nam", "is_public": True},
    {"date": "2027-05-01", "name": "Quốc tế Lao động", "is_public": True},
    {"date": "2027-09-02", "name": "Quốc khánh nước CHXHCN Việt Nam", "is_public": True},
]

def fetch_google_calendar_holidays() -> List[Dict[str, Any]]:
    """Fetches public Vietnamese holidays feed from Google Calendar iCal."""
    url = "https://calendar.google.com/calendar/ical/vi.vietnamese%23holiday%40group.v.calendar.google.com/public/basic.ics"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CenterManagerApp/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            content = response.read().decode("utf-8", errors="ignore")
            
        events = []
        raw_events = content.split("BEGIN:VEVENT")
        for ev in raw_events[1:]:
            summary_match = re.search(r"SUMMARY:(.*?)(?:\r?\n)", ev)
            dt_match = re.search(r"DTSTART(?:;VALUE=DATE)?:(\d{4})(\d{2})(\d{2})", ev)
            if summary_match and dt_match:
                name = summary_match.group(1).strip()
                date_str = f"{dt_match.group(1)}-{dt_match.group(2)}-{dt_match.group(3)}"
                is_pub = any(k in name.lower() for k in ["tết", "giải phóng", "quốc tế lao động", "quốc khánh", "giỗ tổ"])
                events.append({
                    "date": date_str,
                    "name": name,
                    "is_public": is_pub
                })
        return events
    except Exception as e:
        print("Notice: Could not fetch Google Calendar holidays iCal:", e)
        return []

@router.get("/api/center/holidays")
def api_get_holidays(year: Optional[int] = None, sync_google: bool = False) -> List[Dict[str, Any]]:
    """Returns official Vietnam state holidays, optionally synced with Google Calendar."""
    holidays_map: Dict[str, Dict[str, Any]] = {}
    
    # 1. Populate built-in verified official holidays
    for h in OFFICIAL_VN_HOLIDAYS:
        holidays_map[h["date"]] = h

    # 2. Optionally merge Google Calendar iCal
    if sync_google:
        gg_events = fetch_google_calendar_holidays()
        for ev in gg_events:
            if ev["date"] not in holidays_map:
                holidays_map[ev["date"]] = ev

    result = list(holidays_map.values())
    if year:
        y_prefix = f"{year}-"
        result = [h for h in result if h["date"].startswith(y_prefix)]
        
    result.sort(key=lambda x: x["date"])
    return result
