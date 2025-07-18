
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function SatisfactionOverview({ averageRating, reviewCount }) {
  const scheme = {
    bg: "bg-pink-500",
    light: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-100"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`relative overflow-hidden ${scheme.light} ${scheme.border} border-2 hover:shadow-lg transition-shadow duration-300 h-full`}>
        <div className={`absolute top-0 right-0 w-24 h-24 ${scheme.bg} rounded-full opacity-10 transform translate-x-8 -translate-y-8`} />
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">ความพึงพอใจวันนี้</p>
              <div className="text-3xl font-bold text-slate-900 flex items-center gap-1">
                {averageRating}
                <Star className={`w-6 h-6 ${scheme.text} fill-current`} />
              </div>
            </div>
            <div className={`p-3 rounded-xl ${scheme.bg} bg-opacity-20`}>
              <Star className={`w-6 h-6 ${scheme.text}`} />
            </div>
          </div>
          
          <div className="flex items-center gap-1 mt-4">
            <span className="text-sm font-medium text-slate-600">
              จาก {reviewCount} รีวิว
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
