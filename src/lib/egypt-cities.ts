export interface EgyptCity {
  name: string;
  lat: number;
  lng: number;
}

const CITIES: EgyptCity[] = [
  { name: 'القاهرة', lat: 30.0444, lng: 31.2357 },
  { name: 'الجيزة', lat: 30.0131, lng: 31.2089 },
  { name: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
  { name: 'الدقهلية', lat: 31.036, lng: 31.38 },
  { name: 'البحيرة', lat: 31.0409, lng: 30.4685 },
  { name: 'الشرقية', lat: 30.5873, lng: 31.5029 },
  { name: 'كفر الشيخ', lat: 31.1119, lng: 30.94 },
  { name: 'الغربية', lat: 30.7871, lng: 31.0019 },
  { name: 'المنوفية', lat: 30.5539, lng: 31.0096 },
  { name: 'القليوبية', lat: 30.462, lng: 31.1844 },
  { name: 'بني سويف', lat: 29.0661, lng: 31.0998 },
  { name: 'الفيوم', lat: 29.3068, lng: 30.8418 },
  { name: 'المنيا', lat: 28.0877, lng: 30.7353 },
  { name: 'أسيوط', lat: 27.1783, lng: 31.1859 },
  { name: 'سوهاج', lat: 26.5569, lng: 31.6948 },
  { name: 'قنا', lat: 26.1644, lng: 32.7271 },
  { name: 'الأقصر', lat: 25.6872, lng: 32.6396 },
  { name: 'أسوان', lat: 24.0889, lng: 32.8998 },
  { name: 'البحر الأحمر', lat: 27.2574, lng: 33.8116 },
  { name: 'الوادي الجديد', lat: 25.495, lng: 30.557 },
  { name: 'مطروح', lat: 31.3541, lng: 27.2373 },
  { name: 'شمال سيناء', lat: 31.1318, lng: 33.7984 },
  { name: 'جنوب سيناء', lat: 28.2418, lng: 33.6225 },
  { name: 'بورسعيد', lat: 31.2565, lng: 32.2841 },
  { name: 'الإسماعيلية', lat: 30.6109, lng: 32.2722 },
  { name: 'السويس', lat: 29.9668, lng: 32.5498 },
  { name: 'دمياط', lat: 31.4175, lng: 31.8144 },
];

function normalize(name: string): string {
  return name
    .replace(/محافظة/g, '')
    .replace(/مدينة/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ال/g, '')
    .replace(/[^\u0600-\u06FF]/g, '')
    .trim();
}

const CITY_BY_NAME = new Map<string, EgyptCity>();
for (const city of CITIES) {
  CITY_BY_NAME.set(normalize(city.name), city);
}

export const EGYPT_CITIES: readonly EgyptCity[] = CITIES;

export function findCityCenter(name: string): { lat: number; lng: number } | null {
  const city = CITY_BY_NAME.get(normalize(name));
  return city ? { lat: city.lat, lng: city.lng } : null;
}

export function matchCityName(parts: string[]): string | null {
  for (const part of parts) {
    if (!part) continue;
    const city = CITY_BY_NAME.get(normalize(part));
    if (city) return city.name;
  }
  return null;
}

export interface EgyptGovernorate {
  name: string;
  center: { lat: number; lng: number };
  places: EgyptCity[];
}

// إحداثيات المدن/الأحياء تقريبية — تُستخدم كقفزة للمستخدم يثبت بعدها الموقع الدقيق على الخريطة.
const GOVERNORATES: EgyptGovernorate[] = [
  {
    name: 'القاهرة',
    center: { lat: 30.0444, lng: 31.2357 },
    places: [
      { name: 'القاهرة', lat: 30.0444, lng: 31.2357 },
      { name: 'وسط البلد', lat: 30.0497, lng: 31.2422 },
      { name: 'الزمالك', lat: 30.058, lng: 31.221 },
      { name: 'جاردن سيتي', lat: 30.039, lng: 31.232 },
      { name: 'شبرا', lat: 30.091, lng: 31.249 },
      { name: 'مدينة نصر', lat: 30.0453, lng: 31.3542 },
      { name: 'مصر الجديدة', lat: 30.0877, lng: 31.3383 },
      { name: 'النزهة', lat: 30.09, lng: 31.34 },
      { name: 'عين شمس', lat: 30.1188, lng: 31.3308 },
      { name: 'الزيتون', lat: 30.096, lng: 31.317 },
      { name: 'المطرية', lat: 30.13, lng: 31.25 },
      { name: 'حدائق القبة', lat: 30.099, lng: 31.286 },
      { name: 'المعادي', lat: 29.9602, lng: 31.2534 },
      { name: 'دار السلام', lat: 29.953, lng: 31.264 },
      { name: 'المقطم', lat: 29.977, lng: 31.278 },
      { name: 'البساتين', lat: 29.968, lng: 31.273 },
      { name: 'حلوان', lat: 29.8462, lng: 31.3286 },
      { name: 'المرج', lat: 30.163, lng: 31.328 },
      { name: 'مدينة السلام', lat: 30.176, lng: 31.24 },
      { name: 'القاهرة الجديدة', lat: 30.035, lng: 31.475 },
      { name: 'التجمع الخامس', lat: 30.006, lng: 31.51 },
      { name: 'التجمع الأول', lat: 30.035, lng: 31.458 },
      { name: 'مدينة بدر', lat: 30.1392, lng: 31.7281 },
    ],
  },
  {
    name: 'الجيزة',
    center: { lat: 30.0131, lng: 31.2089 },
    places: [
      { name: 'الجيزة', lat: 30.0131, lng: 31.2089 },
      { name: 'الدقي', lat: 30.0379, lng: 31.2083 },
      { name: 'العجوزة', lat: 30.031, lng: 31.202 },
      { name: 'المهندسين', lat: 30.0525, lng: 31.2053 },
      { name: 'ميت عقبة', lat: 30.049, lng: 31.188 },
      { name: 'فيصل', lat: 29.99, lng: 31.18 },
      { name: 'الهرم', lat: 29.9886, lng: 31.1456 },
      { name: 'الطالبية', lat: 29.972, lng: 31.198 },
      { name: 'بولاق الدكرور', lat: 30.0, lng: 31.187 },
      { name: 'إمبابة', lat: 30.07, lng: 31.21 },
      { name: 'الوراق', lat: 30.122, lng: 31.213 },
      { name: '6 أكتوبر', lat: 29.9367, lng: 30.9205 },
      { name: 'الشيخ زايد', lat: 30.01, lng: 30.99 },
      { name: 'الحوامدية', lat: 29.9, lng: 31.15 },
      { name: 'البدرشين', lat: 29.85, lng: 31.17 },
      { name: 'العياط', lat: 29.594, lng: 31.253 },
      { name: 'الصف', lat: 29.568, lng: 31.256 },
      { name: 'أطفيح', lat: 29.404, lng: 31.259 },
      { name: 'أوسيم', lat: 30.12, lng: 31.12 },
      { name: 'كرداسة', lat: 30.04, lng: 31.05 },
      { name: 'منشأة القناطر', lat: 30.16, lng: 31.12 },
      { name: 'أبو النمرس', lat: 29.9, lng: 31.2 },
      { name: 'الواحات البحرية', lat: 28.35, lng: 28.9 },
    ],
  },
  {
    name: 'الإسكندرية',
    center: { lat: 31.2001, lng: 29.9187 },
    places: [
      { name: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
      { name: 'المنتزه', lat: 31.289, lng: 30.0188 },
      { name: 'المعمورة', lat: 31.282, lng: 30.033 },
      { name: 'أبو قير', lat: 31.314, lng: 30.069 },
      { name: 'سيدي بشر', lat: 31.255, lng: 29.97 },
      { name: 'سيدي جابر', lat: 31.217, lng: 29.941 },
      { name: 'كليوباترا', lat: 31.232, lng: 29.951 },
      { name: 'الشاطبي', lat: 31.207, lng: 29.92 },
      { name: 'فلمنج', lat: 31.215, lng: 29.935 },
      { name: 'محطة الرمل', lat: 31.2, lng: 29.91 },
      { name: 'الأنفوشي', lat: 31.205, lng: 29.9 },
      { name: 'العطارين', lat: 31.196, lng: 29.903 },
      { name: 'العجمي', lat: 31.14, lng: 29.8 },
      { name: 'الدخيلة', lat: 31.126, lng: 29.814 },
      { name: 'برج العرب', lat: 30.907, lng: 29.55 },
      { name: 'العامرية', lat: 30.991, lng: 29.682 },
    ],
  },
  {
    name: 'الدقهلية',
    center: { lat: 31.036, lng: 31.38 },
    places: [
      { name: 'المنصورة', lat: 31.0404, lng: 31.3785 },
      { name: 'طلخا', lat: 31.048, lng: 31.38 },
      { name: 'نبروه', lat: 31.108, lng: 31.383 },
      { name: 'أجا', lat: 30.94, lng: 31.36 },
      { name: 'ميت غمر', lat: 30.72, lng: 31.26 },
      { name: 'السنبلاوين', lat: 30.879, lng: 31.45 },
      { name: 'دكرنس', lat: 30.963, lng: 31.362 },
      { name: 'منية النصر', lat: 30.88, lng: 31.55 },
      { name: 'بلقاس', lat: 31.348, lng: 31.347 },
      { name: 'شربين', lat: 31.195, lng: 31.545 },
      { name: 'ميت سلسيل', lat: 31.1, lng: 31.34 },
      { name: 'الجمالية', lat: 31.18, lng: 31.87 },
      { name: 'تمي الأمديد', lat: 31.05, lng: 31.61 },
      { name: 'بني عبيد', lat: 30.87, lng: 31.44 },
    ],
  },
  {
    name: 'البحيرة',
    center: { lat: 31.0409, lng: 30.4685 },
    places: [
      { name: 'دمنهور', lat: 31.0451, lng: 30.4685 },
      { name: 'كفر الدوار', lat: 31.13, lng: 30.23 },
      { name: 'إدكو', lat: 31.27, lng: 30.3 },
      { name: 'رشيد', lat: 31.4, lng: 30.42 },
      { name: 'أبو حمص', lat: 31.1, lng: 30.31 },
      { name: 'أبو المطامير', lat: 30.9, lng: 30.23 },
      { name: 'كوم حمادة', lat: 30.86, lng: 30.36 },
      { name: 'الدلنجات', lat: 30.83, lng: 30.5 },
      { name: 'إيتاي البارود', lat: 30.9, lng: 30.66 },
      { name: 'حوش عيسى', lat: 30.99, lng: 30.28 },
      { name: 'المحمودية', lat: 31.21, lng: 30.25 },
      { name: 'الرحمانية', lat: 31.1, lng: 30.65 },
      { name: 'النوبارية', lat: 30.6, lng: 30.1 },
      { name: 'وادي النطرون', lat: 30.58, lng: 30.2 },
    ],
  },
  {
    name: 'الشرقية',
    center: { lat: 30.5873, lng: 31.5029 },
    places: [
      { name: 'الزقازيق', lat: 30.5873, lng: 31.5029 },
      { name: 'بلبيس', lat: 30.418, lng: 31.562 },
      { name: 'العاشر من رمضان', lat: 30.279, lng: 31.75 },
      { name: 'فاقوس', lat: 30.72, lng: 31.8 },
      { name: 'أبو كبير', lat: 30.723, lng: 31.692 },
      { name: 'الحسينية', lat: 30.87, lng: 31.92 },
      { name: 'منيا القمح', lat: 30.51, lng: 31.35 },
      { name: 'ديرب نجم', lat: 30.76, lng: 31.45 },
      { name: 'ههيا', lat: 30.66, lng: 31.63 },
      { name: 'صان الحجر', lat: 30.78, lng: 31.94 },
      { name: 'أولاد صقر', lat: 30.912, lng: 31.97 },
      { name: 'القنايات', lat: 30.62, lng: 31.46 },
    ],
  },
  {
    name: 'كفر الشيخ',
    center: { lat: 31.1119, lng: 30.94 },
    places: [
      { name: 'كفر الشيخ', lat: 31.1119, lng: 30.94 },
      { name: 'دسوق', lat: 31.13, lng: 30.65 },
      { name: 'فوة', lat: 31.2, lng: 30.55 },
      { name: 'مطوبس', lat: 31.28, lng: 30.53 },
      { name: 'بلطيم', lat: 31.56, lng: 31.06 },
      { name: 'برج البرلس', lat: 31.58, lng: 31.03 },
      { name: 'الحامول', lat: 31.31, lng: 31.14 },
      { name: 'بيلا', lat: 31.2, lng: 31.01 },
      { name: 'سيدي سالم', lat: 31.28, lng: 30.8 },
      { name: 'قلين', lat: 31.04, lng: 30.8 },
      { name: 'الرياض', lat: 31.24, lng: 30.95 },
    ],
  },
  {
    name: 'الغربية',
    center: { lat: 30.7871, lng: 31.0019 },
    places: [
      { name: 'طنطا', lat: 30.7871, lng: 31.0019 },
      { name: 'المحلة الكبرى', lat: 30.97, lng: 31.16 },
      { name: 'سمنود', lat: 31.04, lng: 31.2 },
      { name: 'زفتى', lat: 30.71, lng: 31.24 },
      { name: 'السنطة', lat: 30.74, lng: 31.15 },
      { name: 'قطور', lat: 30.95, lng: 30.95 },
      { name: 'بسيون', lat: 30.94, lng: 30.85 },
      { name: 'كفر الزيات', lat: 30.83, lng: 30.83 },
    ],
  },
  {
    name: 'المنوفية',
    center: { lat: 30.5539, lng: 31.0096 },
    places: [
      { name: 'شبين الكوم', lat: 30.5539, lng: 31.0096 },
      { name: 'مدينة السادات', lat: 30.16, lng: 30.78 },
      { name: 'منوف', lat: 30.465, lng: 31.03 },
      { name: 'أشمون', lat: 30.29, lng: 31.03 },
      { name: 'قويسنا', lat: 30.56, lng: 31.18 },
      { name: 'الباجور', lat: 30.43, lng: 31.03 },
      { name: 'بركة السبع', lat: 30.64, lng: 31.13 },
      { name: 'تلا', lat: 30.7, lng: 30.99 },
      { name: 'سرس الليان', lat: 30.48, lng: 31.06 },
      { name: 'الشهداء', lat: 30.58, lng: 30.89 },
    ],
  },
  {
    name: 'القليوبية',
    center: { lat: 30.462, lng: 31.1844 },
    places: [
      { name: 'بنها', lat: 30.462, lng: 31.1844 },
      { name: 'شبرا الخيمة', lat: 30.128, lng: 31.242 },
      { name: 'الخصوص', lat: 30.16, lng: 31.24 },
      { name: 'القناطر الخيرية', lat: 30.18, lng: 31.14 },
      { name: 'قليوب', lat: 30.2, lng: 31.24 },
      { name: 'الخانكة', lat: 30.24, lng: 31.26 },
      { name: 'طوخ', lat: 30.36, lng: 31.25 },
      { name: 'شبين القناطر', lat: 30.3, lng: 31.28 },
      { name: 'كفر شكر', lat: 30.56, lng: 31.38 },
      { name: 'العبور', lat: 30.2, lng: 31.45 },
    ],
  },
  {
    name: 'بني سويف',
    center: { lat: 29.0661, lng: 31.0998 },
    places: [
      { name: 'بني سويف', lat: 29.0661, lng: 31.0998 },
      { name: 'الواسطى', lat: 29.31, lng: 31.18 },
      { name: 'ناصر', lat: 28.97, lng: 30.93 },
      { name: 'أهناسيا', lat: 29.08, lng: 31.01 },
      { name: 'ببا', lat: 28.94, lng: 30.78 },
      { name: 'الفشن', lat: 28.84, lng: 30.79 },
      { name: 'سمسطا', lat: 28.76, lng: 30.81 },
    ],
  },
  {
    name: 'الفيوم',
    center: { lat: 29.3068, lng: 30.8418 },
    places: [
      { name: 'الفيوم', lat: 29.3068, lng: 30.8418 },
      { name: 'طامية', lat: 29.47, lng: 30.9 },
      { name: 'سنورس', lat: 29.44, lng: 30.87 },
      { name: 'إطسا', lat: 29.24, lng: 30.8 },
      { name: 'أبشواي', lat: 29.34, lng: 30.65 },
      { name: 'يوسف الصديق', lat: 29.47, lng: 30.56 },
    ],
  },
  {
    name: 'المنيا',
    center: { lat: 28.0877, lng: 30.7353 },
    places: [
      { name: 'المنيا', lat: 28.0877, lng: 30.7353 },
      { name: 'ملوي', lat: 27.73, lng: 30.84 },
      { name: 'العدوة', lat: 28.64, lng: 30.77 },
      { name: 'مغاغة', lat: 28.65, lng: 30.78 },
      { name: 'بني مزار', lat: 28.51, lng: 30.81 },
      { name: 'مطاي', lat: 28.42, lng: 30.75 },
      { name: 'سمالوط', lat: 28.31, lng: 30.71 },
      { name: 'أبو قرقاص', lat: 27.93, lng: 30.83 },
      { name: 'دير مواس', lat: 27.64, lng: 30.85 },
    ],
  },
  {
    name: 'أسيوط',
    center: { lat: 27.1783, lng: 31.1859 },
    places: [
      { name: 'أسيوط', lat: 27.1783, lng: 31.1859 },
      { name: 'منفلوط', lat: 27.31, lng: 30.86 },
      { name: 'ديروط', lat: 27.57, lng: 30.81 },
      { name: 'أبنوب', lat: 27.26, lng: 31.2 },
      { name: 'القوصية', lat: 27.44, lng: 30.83 },
      { name: 'البداري', lat: 26.96, lng: 31.21 },
      { name: 'أبوتيج', lat: 27.04, lng: 31.32 },
      { name: 'ساحل سليم', lat: 27.07, lng: 31.19 },
      { name: 'الغنايم', lat: 26.85, lng: 31.22 },
    ],
  },
  {
    name: 'سوهاج',
    center: { lat: 26.5569, lng: 31.6948 },
    places: [
      { name: 'سوهاج', lat: 26.5569, lng: 31.6948 },
      { name: 'أخميم', lat: 26.56, lng: 31.75 },
      { name: 'طهطا', lat: 26.77, lng: 31.5 },
      { name: 'المراغة', lat: 26.71, lng: 31.59 },
      { name: 'جرجا', lat: 26.35, lng: 31.89 },
      { name: 'البلينا', lat: 26.29, lng: 32.06 },
      { name: 'المنشأة', lat: 26.47, lng: 31.79 },
      { name: 'ساقلتة', lat: 26.65, lng: 31.67 },
      { name: 'دار السلام', lat: 26.25, lng: 32.09 },
    ],
  },
  {
    name: 'قنا',
    center: { lat: 26.1644, lng: 32.7271 },
    places: [
      { name: 'قنا', lat: 26.1644, lng: 32.7271 },
      { name: 'نجع حمادي', lat: 26.05, lng: 32.24 },
      { name: 'قوص', lat: 25.92, lng: 32.76 },
      { name: 'دشنا', lat: 26.12, lng: 32.48 },
      { name: 'نقادة', lat: 26.12, lng: 32.86 },
      { name: 'أبو تشت', lat: 26.13, lng: 32.15 },
      { name: 'فرشوط', lat: 26.06, lng: 32.24 },
    ],
  },
  {
    name: 'الأقصر',
    center: { lat: 25.6872, lng: 32.6396 },
    places: [
      { name: 'الأقصر', lat: 25.6872, lng: 32.6396 },
      { name: 'القرنة', lat: 25.73, lng: 32.6 },
      { name: 'البياضية', lat: 25.69, lng: 32.57 },
      { name: 'إسنا', lat: 25.29, lng: 32.55 },
      { name: 'أرمنت', lat: 25.62, lng: 32.54 },
      { name: 'الطود', lat: 25.6, lng: 32.64 },
    ],
  },
  {
    name: 'أسوان',
    center: { lat: 24.0889, lng: 32.8998 },
    places: [
      { name: 'أسوان', lat: 24.0889, lng: 32.8998 },
      { name: 'إدفو', lat: 24.98, lng: 32.87 },
      { name: 'كوم أمبو', lat: 24.47, lng: 32.95 },
      { name: 'دراو', lat: 24.41, lng: 32.92 },
      { name: 'نصر النوبة', lat: 23.97, lng: 32.77 },
      { name: 'أبو سمبل', lat: 22.34, lng: 31.62 },
    ],
  },
  {
    name: 'البحر الأحمر',
    center: { lat: 27.2574, lng: 33.8116 },
    places: [
      { name: 'الغردقة', lat: 27.2574, lng: 33.8116 },
      { name: 'سفاجا', lat: 26.74, lng: 33.94 },
      { name: 'القصير', lat: 26.1, lng: 34.28 },
      { name: 'مرسى علم', lat: 25.08, lng: 34.84 },
      { name: 'رأس غارب', lat: 28.36, lng: 33.08 },
      { name: 'الشلاتين', lat: 23.13, lng: 35.59 },
      { name: 'برنيس', lat: 23.94, lng: 35.48 },
    ],
  },
  {
    name: 'الوادي الجديد',
    center: { lat: 25.495, lng: 30.557 },
    places: [
      { name: 'الخارجة', lat: 25.438, lng: 30.542 },
      { name: 'الداخلة', lat: 25.47, lng: 29.03 },
      { name: 'موط', lat: 25.48, lng: 29.06 },
      { name: 'الفرافرة', lat: 27.06, lng: 27.97 },
      { name: 'بلاط', lat: 25.62, lng: 29.25 },
      { name: 'باريس', lat: 24.68, lng: 30.61 },
    ],
  },
  {
    name: 'مطروح',
    center: { lat: 31.3541, lng: 27.2373 },
    places: [
      { name: 'مرسى مطروح', lat: 31.352, lng: 27.2373 },
      { name: 'النجيلة', lat: 31.33, lng: 27.04 },
      { name: 'رأس الحكمة', lat: 31.01, lng: 28.52 },
      { name: 'الضبعة', lat: 31.03, lng: 28.46 },
      { name: 'العلمين', lat: 30.84, lng: 28.95 },
      { name: 'سيدي براني', lat: 31.61, lng: 25.92 },
      { name: 'السلوم', lat: 31.56, lng: 25.16 },
    ],
  },
  {
    name: 'شمال سيناء',
    center: { lat: 31.1318, lng: 33.7984 },
    places: [
      { name: 'العريش', lat: 31.1318, lng: 33.7984 },
      { name: 'رفح', lat: 31.28, lng: 34.25 },
      { name: 'الشيخ زويد', lat: 31.25, lng: 34.12 },
      { name: 'بئر العبد', lat: 31.01, lng: 33.01 },
      { name: 'الحسنة', lat: 30.48, lng: 33.78 },
      { name: 'نخل', lat: 29.9, lng: 33.75 },
    ],
  },
  {
    name: 'جنوب سيناء',
    center: { lat: 28.2418, lng: 33.6225 },
    places: [
      { name: 'الطور', lat: 28.2418, lng: 33.6225 },
      { name: 'شرم الشيخ', lat: 27.9158, lng: 34.33 },
      { name: 'دهب', lat: 28.5, lng: 34.51 },
      { name: 'نويبع', lat: 28.98, lng: 34.66 },
      { name: 'سانت كاترين', lat: 28.56, lng: 33.95 },
      { name: 'طابا', lat: 29.49, lng: 34.89 },
      { name: 'رأس سدر', lat: 29.6, lng: 32.71 },
      { name: 'أبو رديس', lat: 28.9, lng: 33.19 },
    ],
  },
  {
    name: 'بورسعيد',
    center: { lat: 31.2565, lng: 32.2841 },
    places: [
      { name: 'بورسعيد', lat: 31.2565, lng: 32.2841 },
      { name: 'حي العرب', lat: 31.26, lng: 32.29 },
      { name: 'حي الزهور', lat: 31.24, lng: 32.25 },
      { name: 'حي فؤاد', lat: 31.21, lng: 32.32 },
      { name: 'حي الضواحي', lat: 31.27, lng: 32.32 },
      { name: 'الرسوة', lat: 31.2, lng: 32.25 },
    ],
  },
  {
    name: 'الإسماعيلية',
    center: { lat: 30.6109, lng: 32.2722 },
    places: [
      { name: 'الإسماعيلية', lat: 30.6109, lng: 32.2722 },
      { name: 'فايد', lat: 30.32, lng: 32.18 },
      { name: 'التل الكبير', lat: 30.55, lng: 32.0 },
      { name: 'أبو صوير', lat: 30.43, lng: 31.98 },
      { name: 'القنطرة غرب', lat: 30.84, lng: 32.36 },
      { name: 'القنطرة شرق', lat: 30.85, lng: 32.5 },
    ],
  },
  {
    name: 'السويس',
    center: { lat: 29.9668, lng: 32.5498 },
    places: [
      { name: 'السويس', lat: 29.9668, lng: 32.5498 },
      { name: 'حي الأربعين', lat: 29.98, lng: 32.56 },
      { name: 'حي السويس', lat: 29.97, lng: 32.55 },
      { name: 'حي عتاقة', lat: 29.93, lng: 32.43 },
      { name: 'حي الجناين', lat: 29.94, lng: 32.51 },
      { name: 'حي فيصل', lat: 30.01, lng: 32.52 },
    ],
  },
  {
    name: 'دمياط',
    center: { lat: 31.4175, lng: 31.8144 },
    places: [
      { name: 'دمياط', lat: 31.4175, lng: 31.8144 },
      { name: 'رأس البر', lat: 31.514, lng: 31.85 },
      { name: 'عزبة البرج', lat: 31.5, lng: 31.84 },
      { name: 'فارسكور', lat: 31.33, lng: 31.71 },
      { name: 'الزرقا', lat: 31.42, lng: 31.66 },
      { name: 'كفر سعد', lat: 31.35, lng: 31.66 },
      { name: 'كفر البطيخ', lat: 31.47, lng: 31.66 },
      { name: 'السرو', lat: 31.44, lng: 31.6 },
    ],
  },
];

export const EGYPT_GOVERNORATES: readonly EgyptGovernorate[] = GOVERNORATES;

export function governorateOf(name: string): EgyptGovernorate | null {
  const norm = normalize(name);
  if (!norm) return null;
  return (
    GOVERNORATES.find(
      (g) => normalize(g.name) === norm || g.places.some((p) => normalize(p.name) === norm)
    ) ?? null
  );
}

export function placesOf(governorateName: string): EgyptCity[] {
  const gov = GOVERNORATES.find((g) => g.name === governorateName);
  return gov ? gov.places : [];
}

export function isPlaceIn(name: string, governorateName: string): boolean {
  const norm = normalize(name);
  if (!norm) return false;
  const gov = GOVERNORATES.find((g) => g.name === governorateName);
  return !!gov && gov.places.some((p) => normalize(p.name) === norm);
}

export interface LocationMatch {
  governorate: string | null;
  city: string | null;
}

export function matchLocation(parts: string[]): LocationMatch {
  for (const part of parts) {
    if (!part) continue;
    const norm = normalize(part);
    if (!norm) continue;
    for (const gov of GOVERNORATES) {
      const place = gov.places.find((p) => normalize(p.name) === norm);
      if (place) return { governorate: gov.name, city: place.name };
    }
    const gov = GOVERNORATES.find((g) => normalize(g.name) === norm);
    if (gov) return { governorate: gov.name, city: null };
  }
  return { governorate: null, city: null };
}

// هل قيمة المدينة المخزنة تتبع فلتر محافظة/مدينة/حي معيّن؟
// يدعم البيانات القديمة المخزّنة باسم المحافظة نفسها.
// filterGovernorate (اختياري) = المحافظة الصريحة المخزنة في المبنى،
// تُستخدم لكسر التعارض بين أسماء الأحياء المكررة عبر المحافظات (مثل «دار السلام»).
export function matchesCityFilter(
  buildingCity: string,
  filter: string,
  filterGovernorate?: string
): boolean {
  const bn = normalize(buildingCity);
  const fn = normalize(filter);
  if (!bn || !fn) return false;

  // فلتر مسار مطابق للمحافظة الصريحة المخزنة → ممرر دائمًا.
  if (filterGovernorate && normalize(filterGovernorate) === fn) return true;

  const filterGov =
    GOVERNORATES.find((g) => normalize(g.name) === fn) ??
    GOVERNORATES.find((g) => g.places.some((p) => normalize(p.name) === fn));
  if (!filterGov) return false;

  if (bn === normalize(filterGov.name)) return true;

  const inFilter = filterGov.places.some((p) => normalize(p.name) === bn);
  // إذا كانت المدينة تتطابق مع اسم متكرر عبر محافظات، فلا نمررها إلا إذا
  // كانت المحافظة الصريحة (إن وُجدت) هي نفس محافظة الفلتر.
  if (inFilter) {
    if (filterGovernorate) {
      return normalize(filterGovernorate) === normalize(filterGov.name);
    }
    return true;
  }
  return false;
}