import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, User, CalendarCheck } from 'lucide-react';

const patientTypes = [
  {
    type: 'new',
    title: 'ผู้ป่วยใหม่',
    description: 'สำหรับผู้ป่วยที่มาครั้งแรก',
    icon: UserPlus,
    color: 'bg-purple-500 hover:bg-purple-600',
    textColor: 'text-purple-700'
  },
  {
    type: 'returning',
    title: 'ผู้ป่วยเก่า/นัดหมาย',
    description: 'สำหรับผู้ป่วยที่เคยมาแล้วหรือมีการนัดหมาย',
    icon: User,
    color: 'bg-blue-500 hover:bg-blue-600',
    textColor: 'text-blue-700',
    combinedType: true
  }
];

export default function PatientTypeSelector({ selectedType, onSelectType, onSelectCombined }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {patientTypes.map((type) => {
        const Icon = type.icon;
        return (
          <Button
            key={type.type}
            onClick={() => type.combinedType ? onSelectCombined() : onSelectType(type.type)}
            className={`${type.color} text-white h-auto p-6 flex flex-col items-center gap-4 hover:scale-105 transition-all duration-200 shadow-lg`}
          >
            <Icon className="w-16 h-16" />
            <div className="text-center">
              <div className="text-xl font-bold">{type.title}</div>
              <div className="text-sm opacity-90 mt-1">{type.description}</div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}