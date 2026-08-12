// components/dashboard/DashboardStatsGrid.jsx
//
// خمس بطاقات إحصائيات لداشبورد المنظمة، بتعيد استخدام StatCard
// الموحّد أصلًا بالمشروع (نفس البطاقة المستخدمة بصفحتي Home وAbout)
// بدل إنشاء بطاقة جديدة تؤدي نفس الوظيفة.

import { BellRing } from "lucide-react";
import StatCard from "../common/StatCard";

export default function DashboardStatsGrid({ data }) {
  const stats = [
    { number: data.totalVolunteers, label: "Total Volunteers" },
    { number: data.totalOpportunities, label: "Published Opportunities" },
    // العنصر الوحيد اللي يستاهل انتباه فوري فعلي (طلبات جديدة بانتظار
    // مراجعة) — أيقونة مميزة تفرزه بصريًا عن باقي الإحصائيات الوصفية البحتة
    { number: data.pendingRequests, label: "New Requests", icon: BellRing },
    { number: data.completionRate, label: "Completion Rate", suffix: "%" },
    // مجموع "الالتزام"، مش الساعات المؤكدة نهائيًا لكل فرصة — راجع
    // التعليق بـ services/dashboard.js لتوضيح الفرق بين committedHours
    // وhoursLogged. التلميح هون يعكس نفس التوضيح للمستخدم نفسه، مش
    // للمطوّر بس
    {
      number: data.totalHoursPledged,
      label: "Hours Pledged",
      suffix: "",
      hint: "Hours volunteers committed to when they joined — not yet confirmed by you after each opportunity ends.",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          number={stat.number}
          label={stat.label}
          suffix={stat.suffix}
          hint={stat.hint}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}