// مركز إشعارات مصغّر — فحص دوري (Polling) + عند كل تنقّل بالموقع (نفس
// فلسفة useUnseenAchievements وuseUnseenHoursConfirmation، بس مجمّعين
// هون بمكان واحد بدل نقطة حمراء صامتة). كل عنصر برجع منه اسم/سبب/رابط،
// حتى الـ Dropdown بالنافبار يقدر يعرضهم كقائمة صغيرة بدل بس نقطة بدون تفسير.
//
// منطق "جلب وتجميع" البيانات صار بالكامل جوا services/notifications.js
// (مو هون) — الـ Hook مسؤول بس عن: التوقيت (polling)، وتيرة إعادة الفحص
// عند تغيير الصفحة، وربط الحالة بالـ Navbar. هيك لما يجهز endpoint
// التنبيهات الحقيقي بالباك اند، التعديل بيصير بملف الخدمة فقط، وهاد
// الملف ما بيلزمه أي تغيير إطلاقًا.

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ACCOUNT_TYPES } from "../constants/auth/accountTypes";
import { fetchRecentNotifications } from "../services/notifications";
import { getOrganizationId } from "../utils/auth/getOrganizationId";

// كل 5 ثواني — كافي لتجربة سلسة بدون ما نضرب الأداء، وبنفس الوقت مش
// معتمدين بس على تغيير الصفحة (اللي كان السبب الحقيقي وراء المشكلة:
// المتطوع يمنح إنجاز وهمي ويضل بنفس الصفحة، فما كان في أي محفّز لإعادة
// الفحص إطلاقًا لحد ما يتنقّل لصفحة تانية)
const POLL_INTERVAL_MS = 5000;

export default function useRecentUpdates() {
  const { user, isAuthenticated, accountType } = useAuth();
  const location = useLocation();
  const organizationId = getOrganizationId(user);
  // منظمة بدون organizationId (نادر — راجع feedback-org-account-data-flow)
  // ما إلها تنبيهات توثيق ممكنة أصلًا، فمنعتبرها غير مؤهّلة هون كمان
  const isNotifiable =
    isAuthenticated &&
    (accountType === ACCOUNT_TYPES.VOLUNTEER ||
      (accountType === ACCOUNT_TYPES.ORGANIZATION && Boolean(organizationId)) ||
      accountType === ACCOUNT_TYPES.ADMIN);
  const [items, setItems] = useState([]);
  // فشل الجلب كان يُبتلع بصمت (setItems([]) بس) — ما في أي فرق بالعرض
  // بين "لا توجد تنبيهات فعليًا" و"فشل الجلب"، لا للمستخدم ولا للمطوّر.
  // هلق منعلّم حالة خطأ صريحة تنعرض لحالها (راجع notifications.jsx)
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isNotifiable) return undefined;

    let isMounted = true;
    let intervalId = null;

    function checkForUpdates() {
      fetchRecentNotifications({ accountType, organizationId })
        .then((nextItems) => {
          if (!isMounted) return;
          setItems(nextItems);
          setHasError(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setItems([]);
          setHasError(true);
        });
    }

    function startPolling() {
      checkForUpdates();
      if (intervalId) return;
      intervalId = setInterval(checkForUpdates, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    }

    // ⚠️ ما في داعي نضرب السيرفر كل 5 ثواني لجلسة مفتوحة بتبويب بالخلفية
    // (مثلًا المستخدم فاتح تبويب تاني لساعات) — نوقف الاستطلاع بالكامل
    // لما التبويب يختفي، ونعيد جلب فوري + تشغيل الاستطلاع من جديد لما
    // يرجع ظاهر، بدل ما نستنى دورة الـ 5 ثواني التالية
    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    }

    if (!document.hidden) startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isNotifiable, accountType, organizationId, location.pathname]);

  return {
    items: isNotifiable ? items : [],
    hasUnseen: isNotifiable && items.length > 0,
    hasError: isNotifiable && hasError,
  };
}