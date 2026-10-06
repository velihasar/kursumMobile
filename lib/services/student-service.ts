import { apiClient } from '../api-client';
import { fetchCourses, Course } from './course-service';
import { fetchAttendances } from './attendance-service';
import { fetchWalletInfo, WalletInfo } from './wallet-service';

export interface ChildStudent {
  id: number;
  fullName: string;
  schoolNumber?: string;
  gradeLevel?: string;
  branchName?: string;
  courseCount: number;
  attendanceRate: number;
  nextLesson?: {
    subject: string;
    time: string;
    classroom?: string;
    teacher?: string;
  };
  paymentInfo?: {
    balance: number;
    nextPaymentAmount: number;
    nextPaymentDate: string;
    totalDebt: number;
    hasDebt: boolean;
  };
}

const TURKISH_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function parseDaysOfWeek(daysOfWeekStr?: string): number[] {
  if (!daysOfWeekStr) return [];
  const text = daysOfWeekStr.toLocaleLowerCase('tr-TR');
  const matchedDays = new Set<number>();

  if (text.includes('pazartesi') || text.includes('pzt')) {
    matchedDays.add(1);
  }
  if (text.includes('salı') || text.includes('sali')) {
    matchedDays.add(2);
  }
  if (text.includes('çarşamba') || text.includes('carsamba') || text.includes('çrş') || text.includes('crs')) {
    matchedDays.add(3);
  }
  if (text.includes('perşembe') || text.includes('persembe') || text.includes('prş') || text.includes('prs')) {
    matchedDays.add(4);
  }
  if (text.includes('cumartesi') || text.includes('cmt')) {
    matchedDays.add(6);
  }

  // Cuma: Exclude cumartesi
  const textWithoutCumartesi = text.replace(/cumartesi|cmt/g, '');
  if (textWithoutCumartesi.includes('cuma') || textWithoutCumartesi.includes('cum')) {
    matchedDays.add(5);
  }

  // Pazar: Exclude pazartesi
  const textWithoutPazartesi = text.replace(/pazartesi|pzt/g, '');
  if (textWithoutPazartesi.includes('pazar') || textWithoutPazartesi.includes('pzr')) {
    matchedDays.add(0);
  }

  return Array.from(matchedDays);
}

function calculateNextLesson(courses: Course[]) {
  if (!courses || courses.length === 0) return undefined;

  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  interface ScheduledSession {
    course: Course;
    dayIndex: number;
    daysDiff: number;
    time: string;
    dayLabel: string;
  }

  const upcomingSessions: ScheduledSession[] = [];

  for (const c of courses) {
    if (!c.daysOfWeek) continue;
    const courseDays = parseDaysOfWeek(c.daysOfWeek);

    for (let d = 0; d < 7; d++) {
      const targetDayIndex = (currentDayIndex + d) % 7;

      if (courseDays.includes(targetDayIndex)) {
        const startTime = c.startTime || '09:00';
        if (d === 0 && startTime <= currentTimeStr) {
          continue;
        }

        let dayLabel = TURKISH_DAYS[targetDayIndex];
        if (d === 0) dayLabel = 'Bugün';
        else if (d === 1) dayLabel = 'Yarın';

        upcomingSessions.push({
          course: c,
          dayIndex: targetDayIndex,
          daysDiff: d,
          time: startTime,
          dayLabel,
        });
      }
    }
  }

  if (upcomingSessions.length > 0) {
    upcomingSessions.sort((a, b) => {
      if (a.daysDiff !== b.daysDiff) return a.daysDiff - b.daysDiff;
      return a.time.localeCompare(b.time);
    });

    const next = upcomingSessions[0];
    return {
      subject: next.course.name,
      time: `${next.dayLabel} ${next.time}`,
      classroom: next.course.branchName || '',
      teacher: next.course.teacherName || '',
    };
  }

  const first = courses[0];
  return {
    subject: first.name,
    time: first.daysOfWeek ? `${first.daysOfWeek} ${first.startTime || ''}`.trim() : 'Haftalık Program',
    classroom: first.branchName || '',
    teacher: first.teacherName || '',
  };
}

export async function fetchParentStudents(parentId?: number | string, defaultStudentId?: number | string): Promise<ChildStudent[]> {
  try {
    const res = await apiClient.get('/api/StudentParents/getall');
    const allStudentParents = res.data?.data || res.data || [];

    let matched = Array.isArray(allStudentParents)
      ? allStudentParents.filter((sp: any) => !parentId || sp.parentId == parentId)
      : [];

    if (matched.length > 0) {
      const students: ChildStudent[] = await Promise.all(
        matched.map(async (sp: any) => {
          const sId = sp.studentId;
          const [courses, attendances, wallet] = await Promise.all([
            fetchCourses(sId),
            fetchAttendances(sId),
            fetchWalletInfo(sId),
          ]);

          const present = attendances.filter((a) => a.status === 'Geldi').length;
          const rate = attendances.length > 0 ? Math.round((present / attendances.length) * 100) : 100;

          return {
            id: sId,
            fullName: sp.studentName || 'Öğrenci',
            schoolNumber: sp.studentNumber || undefined,
            gradeLevel: undefined,
            branchName: sp.branchName || undefined,
            courseCount: courses.length,
            attendanceRate: attendances.length > 0 ? rate : 100,
            nextLesson: calculateNextLesson(courses),
            paymentInfo: {
              balance: wallet.balance,
              nextPaymentAmount: wallet.nextPaymentAmount,
              nextPaymentDate: wallet.nextPaymentDate,
              totalDebt: wallet.totalDebt,
              hasDebt: (wallet.nextPaymentAmount > 0 || wallet.totalDebt > 0),
            },
          };
        })
      );
      return students;
    }

    if (defaultStudentId) {
      const [courses, attendances, wallet] = await Promise.all([
        fetchCourses(defaultStudentId),
        fetchAttendances(defaultStudentId),
        fetchWalletInfo(defaultStudentId),
      ]);

      const present = attendances.filter((a) => a.status === 'Geldi').length;
      const rate = attendances.length > 0 ? Math.round((present / attendances.length) * 100) : 100;

      return [
        {
          id: Number(defaultStudentId),
          fullName: 'Öğrenci',
          courseCount: courses.length,
          attendanceRate: attendances.length > 0 ? rate : 100,
          nextLesson: calculateNextLesson(courses),
          paymentInfo: {
            balance: wallet.balance,
            nextPaymentAmount: wallet.nextPaymentAmount,
            nextPaymentDate: wallet.nextPaymentDate,
            totalDebt: wallet.totalDebt,
            hasDebt: (wallet.nextPaymentAmount > 0 || wallet.totalDebt > 0),
          },
        },
      ];
    }

    return [];
  } catch {
    return [];
  }
}
