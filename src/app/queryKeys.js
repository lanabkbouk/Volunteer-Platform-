// نقطة مركزية واحدة لكل مفاتيح React Query بالمشروع. بدل ما كل hook يكتب
// سلسلة نصية زي ['opportunities', 'list', filters] يدويًا (وباحتمال يغلط
// بحرف، أو ينسى مفتاح فرعي معرّف بمكان تاني)، كل المفاتيح معرّفة هون
// مرة وحدة كدوال، وأي hook أو صفحة تحتاج مفتاح تستورده من هون بس.
export const queryKeys = {
  categories: {
    all: ['categories'],
  },

  skills: {
    all: ['skills'],
  },

  cities: {
    all: ['cities'],
  },

  stats: {
    platform: ['stats', 'platform'],
  },

  organization: {
    profile: (organizationId) => ['organization', 'profile', organizationId],
    // لوحة تحكم المنظمة (إحصائيات + توزيع فرص + نشاطات) — مرتبطة بمعرّف
    // المنظمة نفسه، بنفس منطق "profile" أعلاه، حتى ما يصير cache
    // collision بين منظمتين أو بين جلسة فيها منظمة وأخرى بدونها
    dashboard: (organizationId) => ['organization', 'dashboard', organizationId],
  },

  // دليل المنظمات العام (Organizations Directory) — منفصل عمدًا عن
  // "organization" أعلاه: هذا لتصفح أي منظمة من الخارج، مش لبروفايل
  // منظمتي أنا
  organizations: {
    list: (filters) => ['organizations', 'list', filters],
    detail: (id) => ['organizations', 'detail', id],
    opportunities: (id) => ['organizations', 'opportunities', id],
  },

  opportunities: {
    // المفتاح الجذر — تبطيله لحاله (invalidateQueries) بيشمل تلقائيًا
    // كل الفروع تحته (list/detail/mine/suggested/completed)، لأن React
    // Query بيطابق المفاتيح بالـ prefix
    all: ['opportunities'],
    list: (filters) => ['opportunities', 'list', filters],
    suggested: (params) => ['opportunities', 'suggested', params],
    detail: (id) => ['opportunities', 'detail', id],
    mine: (organizationId) => ['opportunities', 'mine', organizationId],
    completed: ['opportunities', 'completed'],
  },

  admin: {
    // قائمة طلبات توثيق المنظمات بانتظار مراجعة الأدمن
    pendingOrganizations: ['admin', 'organizations', 'pending'],
    organizations: ['admin', 'organizations', 'all'],
    volunteers: ['admin', 'volunteers'],
    opportunities: ['admin', 'opportunities'],
    dashboard: ['admin', 'dashboard'],
  },

  participations: {
    all: ['participations'],
    mine: ['participations', 'mine'],
    applicants: (opportunityId) => ['participations', 'applicants', opportunityId],
  },
}