
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

const colorSchemes = {
  blue: {
    bg: "bg-blue-500",
    light: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100"
  },
  yellow: {
    bg: "bg-yellow-500",
    light: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-100"
  },
  green: {
    bg: "bg-green-500",
    light: "bg-green-50",
    text: "text-green-600",
    border: "border-green-100"
  },
  purple: {
    bg: "bg-purple-500",
    light: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100"
  }
};

export default function StatsOverview({ title, value, icon: Icon, color, trend = '' }) {
  const scheme = colorSchemes[color];
  const isPositiveTrend = trend.includes('+') || trend.includes('efficiency');

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
              <p className="text-sm font-medium text-slate-600">{title}</p>
              <div className="text-3xl font-bold text-slate-900">{value}</div>
            </div>
            <div className={`p-3 rounded-xl ${scheme.bg} bg-opacity-20`}>
              <Icon className={`w-6 h-6 ${scheme.text}`} />
            </div>
          </div>
          
          {trend && (
            <div className="flex items-center gap-1 mt-4">
              {isPositiveTrend ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                {trend}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
