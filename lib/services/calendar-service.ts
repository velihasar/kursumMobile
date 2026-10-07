import * as Calendar from 'expo-calendar/legacy';
import { Platform } from 'react-native';
import { Course, Branch } from './course-service';

export interface DayScheduleInfo {
  dayIndex: number; // 0: Paz, 1: Pzt, 2: Sal, 3: Çar, 4: Per, 5: Cum, 6: Cmt
  dayName: string;
  dayShort: string;
  timeRange: string;
  isToday: boolean;
}

/**
 * Calculates next date for a given day index (0..6) with specific hours & minutes
 */
function getNextOccurrenceDate(targetDayIndex: number, hour: number, minute: number): Date {
  const now = new Date();
  const currentDayIndex = now.getDay();
  let dayOffset = (targetDayIndex - currentDayIndex + 7) % 7;

  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, minute, 0, 0);

  // If the event is today but the time has already passed, schedule for next week
  if (dayOffset === 0 && targetDate.getTime() < now.getTime()) {
    targetDate.setDate(targetDate.getDate() + 7);
  }

  return targetDate;
}

/**
 * Adds weekly repeating course schedule to native iOS (Apple Calendar / iCloud) or Android (Google Calendar)
 */
export async function addCourseScheduleToDeviceCalendar(
  course: Course,
  schedules: DayScheduleInfo[],
  branch?: Branch
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Request Calendar Permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        message: 'Dersleri takviminize kaydedebilmek için takvim erişim izni vermeniz gerekmektedir.',
      };
    }

    // 2. Resolve default device calendar ID
    let calendarId: string;
    if (Platform.OS === 'ios') {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      if (!defaultCalendar) {
        return {
          success: false,
          message: 'Cihazınızda kayıtlı bir Apple Takvim bulunamadı.',
        };
      }
      calendarId = defaultCalendar.id;
    } else {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const targetCalendar =
        calendars.find((c) => c.isPrimary || c.accessLevel === Calendar.CalendarAccessLevel.OWNER) ||
        calendars.find((c) => c.allowsModifications) ||
        calendars[0];

      if (!targetCalendar) {
        return {
          success: false,
          message: 'Cihazınızda yazılabilir bir takvim hesabı bulunamadı.',
        };
      }
      calendarId = targetCalendar.id;
    }

    // 3. Create weekly recurring events for each schedule day
    let createdCount = 0;
    const locationStr = [branch?.classroom, branch?.name || course.branchName].filter(Boolean).join(' • ') || 'Kurs Salonu';
    const notesStr = `Kurs: ${course.name}\nEğitmen: ${course.teacherName || branch?.teacherName || 'Ders Eğitmeni'}\nKurum ders takvim kaydı.`;

    for (const sch of schedules) {
      // Parse time range e.g. "20:30 - 21:30" or "09:00 - 11:15"
      const parts = sch.timeRange.split('-');
      const startParts = (parts[0] || '09:00').trim().split(':');
      const endParts = (parts[1] || '10:00').trim().split(':');

      const startHour = parseInt(startParts[0], 10) || 9;
      const startMinute = parseInt(startParts[1], 10) || 0;
      const endHour = parseInt(endParts[0], 10) || (startHour + 1);
      const endMinute = parseInt(endParts[1], 10) || startMinute;

      const startDate = getNextOccurrenceDate(sch.dayIndex, startHour, startMinute);
      const durationMs = (endHour * 60 + endMinute - (startHour * 60 + startMinute)) * 60 * 1000;
      const endDate = new Date(startDate.getTime() + (durationMs > 0 ? durationMs : 60 * 60 * 1000));

      await Calendar.createEventAsync(calendarId, {
        title: `${course.name} Dersi`,
        startDate,
        endDate,
        location: locationStr,
        notes: notesStr,
        timeZone: 'Europe/Istanbul',
        recurrenceRule: {
          frequency: Calendar.Frequency.WEEKLY,
        },
      });

      createdCount++;
    }

    return {
      success: true,
      message: `${course.name} dersi için ${createdCount} haftalık oturum takviminize başarıyla eklendi.`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Ders takvime eklenirken bir hata oluştu.',
    };
  }
}
