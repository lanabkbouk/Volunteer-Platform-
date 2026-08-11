export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  PARTICIPATES: '/participates',
  VOLUNTEER_PROFILE: '/volunteer-profile',
  ORGANIZATION_PROFILE: '/organization-profile',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  EXPLORE: '/explore',
  MY_VOLUNTEERING: '/my-volunteering',
  MY_JOURNEY: '/my-journey',
  DASHBOARD: '/dashboard',
  MY_CAUSES: '/my-causes',
  CREATE_CAUSE: '/my-causes/new',
  APPLICANTS: '/my-causes/applicants',
  OPPORTUNITIES: '/opportunities',
  OPPORTUNITY_DETAILS: '/opportunities/:id',
  ORGANIZATIONS: '/organizations',

  // Admin — مساحة العمل الإدارية
  ADMIN_DASHBOARD: '/admin',
  ADMIN_ORGANIZATIONS: '/admin/organizations',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_CITIES: '/admin/cities',
  ADMIN_PROFILE: '/admin/profile',
  ADMIN_SETTINGS: '/admin/settings',
}

export const LEGACY_REDIRECTS = [
  { from: '/Login', to: ROUTES.LOGIN },
  { from: '/Register', to: ROUTES.REGISTER },
  { from: '/signUp', to: ROUTES.REGISTER },
  { from: '/volunteerProfile', to: ROUTES.VOLUNTEER_PROFILE },
  { from: '/orgProfile', to: ROUTES.ORGANIZATION_PROFILE },
  { from: '/admin/catalog', to: ROUTES.ADMIN_CATEGORIES },
  { from: '/achievements', to: ROUTES.MY_JOURNEY },
]

export const AUTH_QUERY_KEYS = {
  TYPE: 'type',
}