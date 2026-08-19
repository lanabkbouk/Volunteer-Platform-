// تواليد تواريخ نسبية لـ Date.now () بدل تواريخ تقويمية ثابتة — بدون
// هيك، أي فرصة وهمية كانت رح تتحول لـ "completed" بمجرد ما التاريخ
// الحقيقي يتخطى تاريخها المكتوب يدويًا (راجع getEffectiveOpportunityStatus
// بـ utils/opportunityStatus.js يلي بيقارن الآن مع startDate/endDate)
function daysFromNow(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

export const MOCK_OPPORTUNITIES = [
  {
    id: 'o1',
    title: 'Clean Water for All',
    description:
      'Help install and maintain clean water access points for underserved communities. No prior experience required — training is provided on site.',
    status: 'open',
    // تاريخ إنشاء الفرصة الفعلي — ثابت بالماضي القريب، يُستخدم بتحقق
    // startDate/registerStartAt (opportunityValidation.js) عند التعديل
    createdAt: daysFromNow(-5),
    startDate: daysFromNow(14),
    endDate: daysFromNow(45),
    location: 'Rotterdam, Netherlands',
    minHours: 2,
    maxHours: 6,
    totalHours: 120,
    currentVolunteers: 14,
    minVolunteers: 20,
    maxVolunteers: 30,
    category: { id: 'c1', name: 'Health' },
    skills: [{ id: 's1', name: 'First Aid' }, { id: 's7', name: 'Communication' }],
    organization: { id: 'org-mock', name: 'Blue Drop Foundation', imageUrl: null, phone: '+31611111111' },
    image: null,
  },
  {
    id: 'o2',
    title: 'After-School Tutoring Program',
    description:
      'Support local students with homework help and basic literacy skills, twice a week in the afternoon.',
    status: 'open',
    createdAt: daysFromNow(-8),
    startDate: daysFromNow(40),
    endDate: daysFromNow(160),
    location: 'The Hague, Netherlands',
    minHours: 2,
    maxHours: 4,
    totalHours: 80,
    currentVolunteers: 9,
    minVolunteers: 10,
    maxVolunteers: 15,
    category: { id: 'c2', name: 'Education' },
    skills: [{ id: 's4', name: 'Teaching' }, { id: 's5', name: 'Tutoring' }],
    organization: { id: 'org-mock', name: 'Bright Minds NGO', imageUrl: null, phone: '+31622222222' },
    image: null,
  },
  {
    id: 'o3',
    title: 'Coastal Cleanup Day',
    description:
      'Join a one-day beach and coastal cleanup effort to protect local marine ecosystems.',
    status: 'open',
    createdAt: daysFromNow(-3),
    startDate: daysFromNow(20),
    endDate: daysFromNow(20),
    location: 'Scheveningen Beach, NL',
    minHours: 3,
    maxHours: 5,
    totalHours: 40,
    currentVolunteers: 22,
    minVolunteers: 26,
    maxVolunteers: 40,
    category: { id: 'c5', name: 'Environment' },
    skills: [{ id: 's12', name: 'Environmental Awareness' }],
    organization: { id: 'org-mock', name: 'Green Coast Initiative', imageUrl: null, phone: '+31633333333' },
    image: null,
  },
  {
    id: 'o4',
    title: 'Community Food Bank Support',
    description:
      'Sort, pack, and distribute food donations to families in need across the city.',
    status: 'open',
    createdAt: daysFromNow(-30),
    startDate: daysFromNow(-10),
    endDate: daysFromNow(70),
    location: 'Rotterdam, Netherlands',
    minHours: 3,
    maxHours: 6,
    totalHours: 150,
    currentVolunteers: 30,
    minVolunteers: 32,
    maxVolunteers: 50,
    category: { id: 'c3', name: 'Social' },
    skills: [{ id: 's8', name: 'Event Management' }],
    organization: { id: 'org-mock', name: 'City Food Bank', imageUrl: null, phone: '+31644444444' },
    image: null,
  },
  {
    id: 'o5',
    title: 'Winter Clothes Drive',
    description:
      'Collected and distributed warm clothing to families ahead of the winter season.',
    status: 'closed',
    createdAt: daysFromNow(-120),
    startDate: daysFromNow(-90),
    endDate: daysFromNow(-50),
    location: 'Rotterdam, Netherlands',
    minHours: 2,
    maxHours: 4,
    totalHours: 200,
    currentVolunteers: 25,
    minVolunteers: 4,
    maxVolunteers: 25,
    category: { id: 'c3', name: 'Social' },
    skills: [{ id: 's8', name: 'Event Management' }],
    organization: { id: 'org-mock', name: 'City Food Bank', imageUrl: null, phone: '+31644444444' },
    image: null,
  },
  {
    id: 'o6',
    title: 'Summer Reading Camp',
    description:
      'A two-week reading and literacy camp for children in underserved neighborhoods.',
    status: 'closed',
    createdAt: daysFromNow(-220),
    startDate: daysFromNow(-200),
    endDate: daysFromNow(-186),
    location: 'The Hague, Netherlands',
    minHours: 3,
    maxHours: 5,
    totalHours: 180,
    // ⚠️ عمدًا currentVolunteers أقل من minVolunteers هون: هاي الفرصة
    // منتهية فعليًا (endDate بالماضي، فـ status المحسوب COMPLETED) لكنها
    // ما وصلت للعدد الأدنى المطلوب — سيناريو الاختبار الوحيد المتاح
    // حاليًا يثبت إن isSuccessfulOpportunity() (utils/opportunityStatus.js)
    // فعليًا بتستبعدها من "Success Stories"، بعكس فلتر status القديم
    // يلي كان رح يعرضها بالغلط كقصة نجاح
    currentVolunteers: 8,
    minVolunteers: 12,
    maxVolunteers: 18,
    category: { id: 'c2', name: 'Education' },
    skills: [{ id: 's4', name: 'Teaching' }],
    organization: { id: 'org-mock', name: 'Bright Minds NGO', imageUrl: null, phone: '+31622222222' },
    image: null,
  },
];

export const MOCK_MY_ORGANIZATION_ID = "org-mock"; // ID افتراضي للمنظمة الخاصة بالمستخدم (لأغراض Mock)