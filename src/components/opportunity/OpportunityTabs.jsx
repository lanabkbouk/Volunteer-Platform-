// components/opportunity/OpportunityTabs.jsx
//
// غلاف رقيق فوق components/ui/Tabs.jsx العام — تبويبات "كل الفرص"
// و"الفرص المصنّفة مناسبة إلك" جاهزة مسبقًا، بنفس الـ API القديم
// بالضبط (activeTab/onChange) حتى ما تحتاج OpportunitiesListPage.jsx
// أي تعديل.

import Tabs from "../ui/Tabs";
import { OPPORTUNITY_TAB_DEFS } from "../../constants/opportunityTabs";

export default function OpportunityTabs({ activeTab, onChange, className = "" }) {
  return (
    <Tabs
      tabs={OPPORTUNITY_TAB_DEFS}
      activeTab={activeTab}
      onChange={onChange}
      ariaLabel="Opportunities view"
      className={className}
    />
  )
}
