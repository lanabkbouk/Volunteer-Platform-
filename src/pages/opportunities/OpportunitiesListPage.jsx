import { useCallback, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sparkles, SearchX, Loader2, SlidersHorizontal, ChevronDown } from "lucide-react";
import Typography from "../../components/ui/Typography";
import OpportunityCard from "../../components/opportunity/OpportunityCard";
import CategorySidebar from "../../components/opportunity/CategorySidebar";
import OpportunityTabs from "../../components/opportunity/OpportunityTabs";
import { OPPORTUNITY_TABS } from "../../constants/opportunityTabs";
import CardSkeleton from "../../components/ui/CardSkeleton";
import EmptyState from "../../components/common/EmptyState";
import AuthAlert from "../../components/auth/AuthAlert";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { useOpportunitiesQuery } from "../../hooks/queries/useOpportunitiesQuery";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useAuth } from "../../context/AuthContext";
import { ACCOUNT_TYPES } from "../../constants/auth/accountTypes";
import { OPPORTUNITY_STATUS } from "../../constants/opportunityStatus";
import { ROUTES } from "../../constants/paths";

export default function OpportunitiesListPage() {
  const navigate = useNavigate();
  const { isAuthenticated, accountType, user } = useAuth();
  const isVolunteer = isAuthenticated && accountType === ACCOUNT_TYPES.VOLUNTEER;

  // ⚠️ الفلترة كلها مصدرها الوحيد الآن هو الـ URL نفسه (searchParams)،
  // مش useState منفصلة — هيك تحديث الصفحة، أو مشاركة الرابط لصديق،
  // أو زر رجوع المتصفح، كلها بترجّع نفس الفلاتر بالضبط تلقائيًا،
  // بدل ما تُفقد لحظة أي تنقّل. replace:true (مش push) عند كل تغيير
  // فلتر، حتى ما نملي سجل المتصفح بخطوة رجوع منفصلة لكل ضغطة تصنيف
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategoryId = searchParams.get("categories") || null;
  const search = searchParams.get("q") || "";

  const updateParam = useCallback(
    (key, value) => {
      setSearchParams(
        (params) => {
          if (value) params.set(key, value);
          else params.delete(key);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSearch = (value) => updateParam("q", value);
  // ضغط نفس التصنيف المختار حاليًا يلغي الاختيار، وإلا يستبدله (اختيار
  // مفرد فقط، وليس إضافة لمصفوفة)
  const selectCategory = (id) => updateParam("categories", selectedCategoryId === id ? "" : id);

  // التبويب متاح بس للمتطوعين — الزائر والمنظمة بيشوفوا "كل الفرص" دايمًا
  const [activeTab, setActiveTab] = useState(OPPORTUNITY_TABS.ALL);
  const isSuggestedTab = isVolunteer && activeTab === OPPORTUNITY_TABS.SUGGESTED;

  // تأخير 300ms على البحث بس (نفس القيمة القديمة بالضبط) — التبويب
  // المقترح ما بيعتمد على البحث أصلًا فما بيتأثر فيه
  const debouncedSearch = useDebouncedValue(search, 300);

  const categoriesQuery = useCategoriesQuery();
  const opportunitiesQuery = useOpportunitiesQuery({
    isSuggestedTab,
    search: debouncedSearch,
    categoryIds: selectedCategoryId ? [selectedCategoryId] : [],
    user,
  });

  const categories = categoriesQuery.data ?? [];
  const opportunities = opportunitiesQuery.data;
  // قرار: صفحة الاستكشاف (زائر أو متطوع، سواء) بتعرض بس الفرص المفتوحة
  // للتسجيل فعليًا. أي حالة تانية (مقفولة/شغالة/منتهية) ما إلها قيمة
  // عملية لحدا لسا ما انضم — بتضل متاحة عبر رابط مباشر لصفحة التفاصيل،
  // أو بقسم "Past Opportunities" ببروفايل المنظمة، بس مش هون
  const visibleOpportunities = useMemo(() => {
    if (!Array.isArray(opportunities)) return [];

    const openOnly = opportunities.filter(
      (opportunity) => opportunity.status === OPPORTUNITY_STATUS.REGISTRATION_OPEN,
    );

    // تبويب "Suggested" بيحتفظ بترتيبه الخاص (الأعلى تطابقًا أولًا،
    // محسوب مسبقًا بـ computeMatchScore عبر fetchSuggestedOpportunities)
    // — ما منلمسه هون. الترتيب تصاعديًا حسب registerEndAt (الأقرب لانتهاء
    // نافذة التسجيل أول) بس لتبويب "All": فرصة تسجيلها بيقفل قريب أكثر
    // إلحاحًا لقرار الزائر/المتطوع من فرصة تسجيلها لسا مفتوح لفترة طويلة
    if (isSuggestedTab) return openOnly;
    return [...openOnly].sort((a, b) => new Date(a.registerEndAt) - new Date(b.registerEndAt));
  }, [opportunities, isSuggestedTab]);

  // isPending = ما في أي بيانات لسا (أول تحميل فعلي لهالفلتر بالذات) —
  // بيختلف عن isFetching اللي بيصير true حتى أثناء إعادة الجلب بالخلفية
  // (لما نغيّر فلتر ولسا عنا نتيجة سابقة ظاهرة بفضل placeholderData)
  const isInitialLoading = opportunitiesQuery.isPending;
  const isRefetching = opportunitiesQuery.isFetching && !isInitialLoading;
  const error = opportunitiesQuery.isError
    ? opportunitiesQuery.error?.message || "Failed to load opportunities"
    : "";

  const resultsLabel = useMemo(() => {
    const count = visibleOpportunities.length;
    return `${count} opportunit${count === 1 ? "y" : "ies"} found`;
  }, [visibleOpportunities.length]);

  // بتبويب "Suggested" بس: تجميع بمستوى واحد حسب سبب الترشيح (سلوك
  // المتطوع — مهاراته ومدينته)، مش حسب التصنيف. تصنيف الفرصة
  // (Health/Education...) ضل داخل كل بطاقة كالمعتاد (Chip)، مش عنوان
  // قسم خارجي. ترتيب الأقسام بيتبع ترتيب أول ظهور بالقائمة المرتّبة
  // أصلًا بالنقاط، فالسبب الأقوى تطابقًا بيطلع أول قسم تلقائيًا
  const groupedByReason = useMemo(() => {
    if (!isSuggestedTab) return [];

    const groups = new Map();
    visibleOpportunities.forEach((opportunity) => {
      const reasonName = opportunity.matchReason || "Recommended for you";
      if (!groups.has(reasonName)) groups.set(reasonName, []);
      groups.get(reasonName).push(opportunity);
    });

    return Array.from(groups.entries());
  }, [isSuggestedTab, visibleOpportunities]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Typography variant="sectionTitle" className="mb-2">
        Volunteering Opportunities
      </Typography>
      <Typography variant="body" className="mb-8 text-body">
        Find a cause that matches your skills and availability.
      </Typography>

      {isVolunteer ? (
        <OpportunityTabs activeTab={activeTab} onChange={setActiveTab} />
      ) : null}

      <div className="flex flex-col lg:flex-row gap-8">
        {!isSuggestedTab ? (
          <>
            {/* موبايل: قائمة الفلاتر/التصنيفات مطوية افتراضيًا (details/summary)
                — بدل ما الزائر يتمرّر عبر القائمة كاملة قبل ما يشوف أول
                كارد فرصة فعلي. من lg فما فوق نفس القائمة تظهر دايمًا
                موسّعة بالعمود الجانبي كالمعتاد (نسخة ثانية تحت مخصّصة
                لهيك، مخفية بالكامل هون تحت lg) — ترتيب الأقسام بالصفحة
                (فلاتر قبل النتائج) ما تغيّر، بس شكل عرضها على الموبايل بس */}
            <details className="group w-full shrink-0 lg:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-heading/10 bg-field px-4 py-3 text-sm font-semibold text-heading transition-colors hover:bg-heading/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  Filters &amp; Categories
                </span>
                <ChevronDown
                  size={16}
                  className="shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="mt-4">
                <CategorySidebar
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={selectCategory}
                  searchValue={search}
                  onSearchChange={setSearch}
                />
              </div>
            </details>

            <div className="hidden lg:block">
              <CategorySidebar
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={selectCategory}
                searchValue={search}
                onSearchChange={setSearch}
              />
            </div>
          </>
        ) : null}

        <div className={`flex-1 ${isSuggestedTab ? "max-w-5xl mx-auto w-full" : ""}`}>
          {!isInitialLoading ? (
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <p className="text-sm text-heading/50 flex items-center gap-2">
                {resultsLabel}
                {/* مؤشر خفيف أثناء إعادة الجلب بالخلفية (تغيير فلتر/بحث)،
                    بدون ما نخفي النتائج الحالية أو نعرض سكيلتون كامل */}
                {isRefetching ? (
                  <Loader2 size={14} className="animate-spin text-heading/30" aria-hidden="true" />
                ) : null}
              </p>
            </div>
          ) : null}

          {isSuggestedTab ? (
            <div className="flex items-start gap-3 rounded-3xl bg-primary/5 border border-primary/15 p-4 mb-6">
              <Sparkles size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-heading/70">Picked for you based on your skills and city.</p>
            </div>
          ) : null}

          {isInitialLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <AuthAlert variant="error">{error}</AuthAlert>
          ) : visibleOpportunities.length === 0 ? (
            <EmptyState
              icon={isSuggestedTab ? Sparkles : SearchX}
              title={isSuggestedTab ? "No recommended opportunities yet" : "No opportunities found"}
              description={
                isSuggestedTab
                  ? "Update your profile details to get better matches."
                  : "Try a different search term or category."
              }
              actionLabel={isSuggestedTab ? "Update Profile" : undefined}
              onAction={isSuggestedTab ? () => navigate(ROUTES.VOLUNTEER_PROFILE) : undefined}
            />
          ) : isSuggestedTab ? (
            <div className="flex flex-col gap-10">
              {groupedByReason.map(([reasonName, reasonOpportunities]) => (
                <section key={reasonName}>
                  <Typography variant="h4" className="mb-4">
                    {reasonName}
                  </Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {reasonOpportunities.map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        recommended
                        showMatchReason={false}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity">
              {visibleOpportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
