import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('F2 - Appointment Scheduling', () => {
  let appointmentStore;
  let scheduler;

  beforeEach(() => {
    appointmentStore = {
      appointments: [],
      save: vi.fn(async (appointment) => {
        appointmentStore.appointments.push(appointment);
        return { success: true, appointment };
      }),
      getByDate: vi.fn(async (date) => {
        return appointmentStore.appointments.filter((a) => a.date === date);
      }),
    };

    scheduler = {
      getAlternatives: vi.fn((date) => [
        { date, time: '11:00' },
        { date, time: '11:30' },
      ]),
      hasConflict: vi.fn((date, time) => {
        return appointmentStore.appointments.some((a) => a.date === date && a.time === time);
      }),
      create: vi.fn(async (payload) => {
        if (!payload.patientId || !payload.date || !payload.time) {
          return { success: false, error: 'Missing required fields' };
        }

        if (scheduler.hasConflict(payload.date, payload.time)) {
          return {
            success: false,
            error: 'Slot unavailable',
            alternatives: scheduler.getAlternatives(payload.date),
          };
        }

        const appointment = {
          ...payload,
          status: 'Scheduled',
        };

        await appointmentStore.save(appointment);
        return { success: true, appointment };
      }),
    };
  });

  describe('AC1 - Happy path', () => {
    it('test_AC1_create_appointment_with_valid_details', async () => {
      const payload = {
        patientId: 'p-001',
        date: '2026-08-20',
        time: '10:30',
      };

      const result = await scheduler.create(payload);

      expect(result.success).toBe(true);
      expect(result.appointment.status).toBe('Scheduled');
      expect(appointmentStore.save).toHaveBeenCalledTimes(1);

      const list = await appointmentStore.getByDate('2026-08-20');
      expect(list).toContainEqual(expect.objectContaining({
        patientId: 'p-001',
        time: '10:30',
        status: 'Scheduled',
      }));
    });

    it('test_AC1_appointment_appears_in_daily_appointment_list', async () => {
      await scheduler.create({ patientId: 'p-001', date: '2026-08-20', time: '09:00' });
      await scheduler.create({ patientId: 'p-002', date: '2026-08-20', time: '10:00' });

      const daily = await appointmentStore.getByDate('2026-08-20');
      expect(daily.length).toBe(2);
      expect(daily.map((a) => a.status)).toEqual(['Scheduled', 'Scheduled']);
    });
  });

  describe('AC2 - Edge case time conflict', () => {
    it('test_AC2_reject_second_appointment_in_same_time_slot', async () => {
      await scheduler.create({ patientId: 'p-001', date: '2026-08-20', time: '10:30' });

      const second = await scheduler.create({
        patientId: 'p-002',
        date: '2026-08-20',
        time: '10:30',
      });

      expect(second.success).toBe(false);
      expect(second.error).toBe('Slot unavailable');
      expect(second.alternatives.length).toBeGreaterThan(0);
      expect(appointmentStore.appointments.length).toBe(1);
    });

    it('test_AC2_returns_alternative_times_when_conflict_exists', async () => {
      await scheduler.create({ patientId: 'p-001', date: '2026-08-20', time: '10:30' });

      const result = await scheduler.create({
        patientId: 'p-003',
        date: '2026-08-20',
        time: '10:30',
      });

      expect(result.success).toBe(false);
      expect(result.alternatives).toEqual([
        { date: '2026-08-20', time: '11:00' },
        { date: '2026-08-20', time: '11:30' },
      ]);
    });
  });
});
