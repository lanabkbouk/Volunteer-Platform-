import { useMemo, useState } from "react";
import { Building2, SearchX, Loader2 } from "lucide-react";
import Typography from "../../components/ui/Typography";
import OrganizationCard from "../../components/organization/OrganizationCard";
import OrganizationSearchBar from "../../components/organization/OrganizationSearchBar";
import CardSkeleton from "../../components/ui/CardSkeleton";
import EmptyState from "../../components/common/EmptyState";
import ShowMoreButton from "../../components/common/ShowMoreButton";
import AuthAlert from "../../components/auth/AuthAlert";
import { useOrganizationsQuery } from "../../hooks/queries/useOrganizationsQuery";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export default function OrganizationsListPage() {
  const [search, setSearch] = useState("");
  // نفس تأخير 300ms المستخدم بصفحة الفرص — قيمة موحّدة بكل المشروع
  const debouncedSearch = useDebouncedValue(search, 300);

  const organizationsQuery = useOrganizationsQuery({ search: debouncedSearch });
  // كل صفحات useInfiniteQuery مبسوطة بمصفوفة واحدة — كل صفحة هون هي
  // شكل {data, meta, links} المُرجَع من fetchOrganizations (راجع
  // services/organizations.js)
  const organizations = useMemo(
    () => organizationsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [organizationsQuery.data],
  );
  // meta آخر صفحة محمَّلة فعليًا — نعتمد عليها لعدد "الكل" (total) بدل
  // عدد العناصر المحمَّلة لحد الآن بس
  const lastPageMeta = organizationsQuery.data?.pages.at(-1)?.meta;

  const isInitialLoading = organizationsQuery.isPending;
  // isFetching بيصير true كمان أثناء fetchNextPage، فنستثنيها هون
  // حتى ما يظهر مؤشرا تحميل بنفس اللحظة (واحد فوق النتائج، وواحد
  // تاني جنب زر "Show more" أسفل الصفحة)
  const isRefetching =
    organizationsQuery.isFetching && !organizationsQuery.isFetchingNextPage && !isInitialLoading;
  const error = organizationsQuery.isError
    ? organizationsQuery.error?.message || "Failed to load organizations"
    : "";

  const resultsLabel = useMemo(() => {
    // meta.total (لو متوفر) بيعكس العدد الحقيقي الكامل من الباك اند،
    // مش بس عدد العناصر المحمَّلة لحد الآن — وإلا كانت الصفحة رح تعرض
    // "15 organizations found" دايمًا حتى لو في أكتر بكتير قبل ما
    // يضغط المستخدم "Show more" ولا مرة
    const count = typeof lastPageMeta?.total === "number" ? lastPageMeta.total : organizations.length;
    return `${count} organization${count === 1 ? "" : "s"} found`;
  }, [organizations.length, lastPageMeta?.total]);

  // ⚠️ تقريبي بوضع real (راجع ملاحظة الدقة بـ services/organizations.js):
  // meta.total هناك بيعكس عدد نتائج الباك اند الخام قبل فلترة "الموثّقة
  // فقط" المحلية، فممكن يكون أكبر شوي من العدد الفعلي المتبقي. بوضع
  // mock هو دقيق 100% دايمًا. ShowMoreButton نفسه بيتعامل مع undefined
  // بعرض "Show more" عامة بدل رقم لو meta مش متوفرة إطلاقًا
  const remainingCount =
    typeof lastPageMeta?.total === "number" ? Math.max(lastPageMeta.total - organizations.length, 0) : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Typography variant="sectionTitle" className="mb-2">
        Organizations
      </Typography>
      <Typography variant="body" className="mb-8 text-body">
        Discover verified organizations you can volunteer with.
      </Typography>

      <div className="mb-6">
        <OrganizationSearchBar value={search} onChange={setSearch} />
      </div>

      {!isInitialLoading ? (
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm text-heading/50 flex items-center gap-2">
            {resultsLabel}
            {isRefetching ? (
              <Loader2 size={14} className="animate-spin text-heading/30" aria-hidden="true" />
            ) : null}
          </p>
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
      ) : organizations.length === 0 ? (
        <EmptyState
          icon={search ? SearchX : Building2}
          title={search ? "No organizations found" : "No organizations yet"}
          description={
            search
              ? "Try a different search term."
              : "Verified organizations will appear here once they join the platform."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity">
          {organizations.map((organization) => (
            <OrganizationCard key={organization.id} organization={organization} />
          ))}
        </div>
      )}

      {/* أثناء تحميل الصفحة التالية فعليًا، نستبدل الزر بمؤشر تحميل
          صغير بدل ما نعيد رسم الصفحة كاملة أو نسمح بضغطة مزدوجة على
          الزر وهو أصلًا عم يجيب بيانات */}
      {!isInitialLoading && !error && organizationsQuery.hasNextPage ? (
        organizationsQuery.isFetchingNextPage ? (
          <div className="mt-6 flex justify-center">
            <Loader2 size={16} className="animate-spin text-heading/30" aria-hidden="true" />
          </div>
        ) : (
          <ShowMoreButton remainingCount={remainingCount} onClick={() => organizationsQuery.fetchNextPage()} />
        )
      ) : null}
    </div>
  );
}