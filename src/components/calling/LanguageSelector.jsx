import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages } from "lucide-react";

export default function LanguageSelector({ selectedLanguage, setSelectedLanguage, languages }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (value) => {
    setSelectedLanguage(value);
    setIsOpen(false);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-blue-600" />
          ภาษาเสียงเรียก
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Select
          value={selectedLanguage}
          onValueChange={handleValueChange}
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกภาษา" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(languages).map(([code, lang]) => (
              <SelectItem key={code} value={code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}