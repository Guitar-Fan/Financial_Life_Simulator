/**
 * Staff Store - Employee management, skills, scheduling, and task assignment
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Employee, EmployeeRole } from '../types/bakery-game-types';
import { useBakeryFinancialStore } from './bakery-financial-store';

export const useBakeryStaffStore = defineStore('bakeryStaff', () => {
  // ============ State ============
  const staff = ref<Employee[]>([]);
  const assignments = ref<Map<string, string>>(new Map()); // staffId -> taskId

  // ============ Getters ============
  const availableStaff = computed(() => {
    return staff.value.filter(employee => 
      !assignments.value.has(employee.id) && employee.fatigue < 80
    );
  });

  const busyStaff = computed(() => {
    return staff.value.filter(employee => assignments.value.has(employee.id));
  });

  const avgEfficiency = computed(() => {
    if (staff.value.length === 0) return 0;
    const totalEfficiency = staff.value.reduce((sum, emp) => sum + emp.efficiency, 0);
    return totalEfficiency / staff.value.length;
  });

  const monthlyLaborCost = computed(() => {
    return staff.value.reduce((sum, emp) => 
      sum + emp.baseSalary + emp.benefits, 0
    );
  });

  const dailyLaborCost = computed(() => {
    return monthlyLaborCost.value / 30;
  });

  const overtimeHours = computed(() => {
    return staff.value.reduce((sum, emp) => {
      const overtime = Math.max(0, emp.hoursWorkedThisWeek - 40);
      return sum + overtime;
    }, 0);
  });

  const staffByRole = computed(() => {
    const byRole: { [key in EmployeeRole]?: Employee[] } = {};
    staff.value.forEach(emp => {
      if (!byRole[emp.role]) byRole[emp.role] = [];
      byRole[emp.role]!.push(emp);
    });
    return byRole;
  });

  function getEmployeeById(id: string): Employee | undefined {
    return staff.value.find(emp => emp.id === id);
  }

  // ============ Actions ============
  function hireStaff(
    name: string,
    role: EmployeeRole,
    baseSalary: number,
    skillLevel: number = 5
  ) {
    const financialStore = useBakeryFinancialStore();
    
    const employee: Employee = {
      id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      face: getRandomFace(),
      role,
      skillLevel,
      efficiency: 0.8 + (skillLevel / 10) * 0.4, // 0.8 to 1.2 range
      baseSalary,
      benefits: baseSalary * 0.2, // 20% benefits
      happiness: 80,
      fatigue: 0,
      hoursWorkedToday: 0,
      hoursWorkedThisWeek: 0,
      daysWorked: 0,
      trainingLevel: 0,
      trainingCost: 0,
      hireDate: financialStore.day,
    };
    
    staff.value.push(employee);
    return employee.id;
  }

  function fireStaff(employeeId: string) {
    const index = staff.value.findIndex(emp => emp.id === employeeId);
    if (index !== -1) {
      // Remove any assignments
      assignments.value.delete(employeeId);
      staff.value.splice(index, 1);
    }
  }

  function trainStaff(employeeId: string) {
    const employee = staff.value.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const financialStore = useBakeryFinancialStore();
    const trainingCost = 500 * (employee.trainingLevel + 1);
    
    if (financialStore.cash < trainingCost) {
      throw new Error('Not enough cash for training');
    }
    
    financialStore.adjustCash(-trainingCost, `Training ${employee.name}`);
    
    employee.trainingLevel++;
    employee.trainingCost += trainingCost;
    employee.skillLevel = Math.min(10, employee.skillLevel + 1);
    employee.efficiency = 0.8 + (employee.skillLevel / 10) * 0.4;
  }

  function assignTask(employeeId: string, taskId: string) {
    const employee = staff.value.find(emp => emp.id === employeeId);
    if (!employee || employee.fatigue >= 80) {
      throw new Error('Employee unavailable');
    }
    
    assignments.value.set(employeeId, taskId);
  }

  function unassignTask(employeeId: string) {
    assignments.value.delete(employeeId);
  }

  function updateFatigue(employeeId: string, hoursWorked: number) {
    const employee = staff.value.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    employee.hoursWorkedToday += hoursWorked;
    employee.hoursWorkedThisWeek += hoursWorked;
    
    // Fatigue increases with hours worked
    employee.fatigue = Math.min(100, employee.fatigue + hoursWorked * 5);
    
    // Happiness decreases if overworked
    if (employee.hoursWorkedThisWeek > 40) {
      employee.happiness = Math.max(0, employee.happiness - 2);
    }
  }

  function endShift(employeeId: string) {
    const employee = staff.value.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const financialStore = useBakeryFinancialStore();
    
    // Pay daily wage
    const dailyWage = employee.baseSalary / 30;
    const overtimePay = Math.max(0, employee.hoursWorkedToday - 8) * (dailyWage / 8) * 1.5;
    const totalPay = dailyWage + overtimePay;
    
    financialStore.processExpense(totalPay, 'labor');
    
    // Reset daily hours
    employee.hoursWorkedToday = 0;
    employee.daysWorked++;
    
    // Recover some fatigue
    employee.fatigue = Math.max(0, employee.fatigue - 20);
    
    // Unassign any tasks
    assignments.value.delete(employeeId);
  }

  function endWeek() {
    staff.value.forEach(employee => {
      employee.hoursWorkedThisWeek = 0;
      
      // Restore happiness if not overworked
      if (employee.happiness < 80) {
        employee.happiness = Math.min(100, employee.happiness + 10);
      }
    });
  }

  function getRandomFace(): string {
    const faces = ['👨‍🍳', '👩‍🍳', '🧑‍🍳', '👨', '👩', '🧑'];
    return faces[Math.floor(Math.random() * faces.length)];
  }

  function resetStaff() {
    staff.value = [];
    assignments.value.clear();
  }

  return {
    // State
    staff,
    assignments,
    
    // Getters
    availableStaff,
    busyStaff,
    avgEfficiency,
    monthlyLaborCost,
    dailyLaborCost,
    overtimeHours,
    staffByRole,
    getEmployeeById,
    
    // Actions
    hireStaff,
    fireStaff,
    trainStaff,
    assignTask,
    unassignTask,
    updateFatigue,
    endShift,
    endWeek,
    resetStaff,
  };
}, {
  persist: {
    key: 'bakery_staff_state',
    storage: localStorage,
    serializer: {
      serialize: (state) => {
        return JSON.stringify({
          staff: state.staff,
          assignments: Array.from(state.assignments.entries()),
        });
      },
      deserialize: (value) => {
        const data = JSON.parse(value);
        return {
          staff: data.staff,
          assignments: new Map(data.assignments),
        };
      },
    },
  },
});
