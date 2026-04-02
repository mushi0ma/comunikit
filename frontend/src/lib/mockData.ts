// comunikit — Mock data for prototype

export type ListingType = "sell" | "buy" | "service" | "lost" | "found";
export type ListingStatus = "active" | "sold" | "closed" | "draft";

export interface Listing {
  id: string;
  type: ListingType;
  category: string;
  title: string;
  price?: number;
  negotiable?: boolean;
  description: string;
  images: string[];
  author: {
    id: string;
    name: string;
    group: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    telegramHandle?: string;
  };
  status: ListingStatus;
  location?: string;
  createdAt: string;
  views: number;
}

export interface ForumThread {
  id: string;
  category: string;
  title: string;
  author: { name: string; group: string };
  replies: number;
  lastActivity: string;
  tags: string[];
  pinned?: boolean;
}

export interface User {
  id: string;
  name: string;
  group: string;
  studentId: string;
  email: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  karma: number;
  listingsCount: number;
  telegramHandle?: string;
  joinedAt: string;
}

// Unsplash placeholder images for listings
const IMG = {
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80",
  phone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
  book: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
  backpack: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
  sneakers: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80",
  watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
  tablet: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80",
};

export const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    type: "sell",
    category: "Электроника",
    title: "MacBook Air M1 2020, 8GB/256GB, отличное состояние",
    price: 280000,
    description: "Продаю MacBook Air M1. Куплен в 2021 году, использовался аккуратно. Батарея держит 8+ часов. В комплекте зарядка и коробка. Торг уместен.",
    images: [IMG.laptop],
    author: { id: "u1", name: "Алиев А.", group: "CS-21-K", rating: 4.8, reviewCount: 12, telegramHandle: "@aliev_a" },
    status: "active",
    createdAt: "2h ago",
    views: 143,
  },
  {
    id: "2",
    type: "lost",
    category: "Аксессуары",
    title: "Потерял AirPods Pro (2-е поколение) в библиотеке",
    description: "Потерял AirPods Pro в чехле белого цвета. Последний раз видел в читальном зале на 3-м этаже. Вознаграждение гарантирую.",
    images: [IMG.headphones],
    author: { id: "u2", name: "Сейткали Д.", group: "IT-22-A", rating: 4.5, reviewCount: 3 },
    status: "active",
    location: "Библиотека, 3-й этаж",
    createdAt: "5h ago",
    views: 89,
  },
  {
    id: "3",
    type: "found",
    category: "Документы",
    title: "Найдено студенческое удостоверение — Нурланов К.",
    description: "Нашёл студенческое удостоверение у входа в столовую. Владелец — Нурланов К., группа SE-23-B. Напишите в Telegram.",
    images: [],
    author: { id: "u3", name: "Ким А.", group: "CS-21-K", rating: 5.0, reviewCount: 7, telegramHandle: "@kim_a" },
    status: "active",
    location: "Столовая, вход",
    createdAt: "1d ago",
    views: 201,
  },
  {
    id: "4",
    type: "service",
    category: "Услуги",
    title: "Репетитор по математике и физике — подготовка к ЕНТ",
    price: 3000,
    description: "Помогу подготовиться к ЕНТ по математике и физике. Опыт 2 года. Занятия онлайн или в кампусе. Первое занятие бесплатно.",
    images: [IMG.book],
    author: { id: "u4", name: "Жаксыбеков Е.", group: "SE-20-K", rating: 4.9, reviewCount: 28, telegramHandle: "@zhaks_tutor" },
    status: "active",
    createdAt: "3d ago",
    views: 312,
  },
  {
    id: "5",
    type: "sell",
    category: "Электроника",
    title: "Механическая клавиатура Keychron K2, Cherry MX Brown",
    price: 45000,
    negotiable: true,
    description: "Продаю клавиатуру Keychron K2 с переключателями Cherry MX Brown. Состояние отличное, использовалась 6 месяцев.",
    images: [IMG.keyboard],
    author: { id: "u5", name: "Петров И.", group: "IT-21-B", rating: 4.6, reviewCount: 9 },
    status: "active",
    createdAt: "4h ago",
    views: 67,
  },
  {
    id: "6",
    type: "buy",
    category: "Учёба",
    title: "Куплю учебники по дискретной математике и алгоритмам",
    description: "Ищу учебники: Кормен «Алгоритмы», Дискретная математика Новиков. Состояние не важно, главное — наличие.",
    images: [IMG.book],
    author: { id: "u6", name: "Асанова М.", group: "CS-23-A", rating: 4.2, reviewCount: 2 },
    status: "active",
    createdAt: "6h ago",
    views: 45,
  },
  {
    id: "7",
    type: "sell",
    category: "Одежда",
    title: "Кроссовки Nike Air Max 90, размер 42, почти новые",
    price: 32000,
    description: "Продаю кроссовки Nike Air Max 90 в отличном состоянии. Надевал 3 раза. Размер 42 (EU). Цвет: белый/серый.",
    images: [IMG.sneakers],
    author: { id: "u7", name: "Омаров Б.", group: "IT-22-K", rating: 4.7, reviewCount: 15 },
    status: "active",
    createdAt: "1d ago",
    views: 98,
  },
  {
    id: "8",
    type: "lost",
    category: "Электроника",
    title: "Потерян смартфон Samsung Galaxy S23 в аудитории 301",
    description: "Потерял телефон Samsung Galaxy S23 чёрного цвета. Возможно забыл в аудитории 301 или в коридоре 3-го этажа. Вознаграждение 10 000 тг.",
    images: [IMG.phone],
    author: { id: "u8", name: "Байжанов Т.", group: "SE-22-B", rating: 4.4, reviewCount: 6 },
    status: "active",
    location: "Аудитория 301, 3-й этаж",
    createdAt: "30m ago",
    views: 156,
  },
];

export const MOCK_USER: User = {
  id: "u1",
  name: "Алиев Арман",
  group: "CS-21-K",
  studentId: "****1234",
  email: "arman.aliev@aituc.edu.kz",
  rating: 4.8,
  reviewCount: 12,
  karma: 340,
  listingsCount: 7,
  telegramHandle: "@aliev_a",
  joinedAt: "Сентябрь 2021",
};

export const FORUM_THREADS: ForumThread[] = [
  { id: "f1", category: "Учёба", title: "Как сдать экзамен по алгоритмам у Сейткали А.?", author: { name: "Петров И.", group: "IT-21-B" }, replies: 23, lastActivity: "2h ago", tags: ["экзамен", "алгоритмы"], pinned: true },
  { id: "f2", category: "Общее", title: "Где лучше всего учиться в кампусе?", author: { name: "Асанова М.", group: "CS-23-A" }, replies: 41, lastActivity: "4h ago", tags: ["кампус", "учёба"] },
  { id: "f3", category: "События", title: "Hackathon AITUC 2024 — команды и идеи", author: { name: "Жаксыбеков Е.", group: "SE-20-K" }, replies: 67, lastActivity: "1d ago", tags: ["хакатон", "команда"] },
  { id: "f4", category: "Жильё", title: "Ищу сожителя для аренды квартиры рядом с кампусом", author: { name: "Ким А.", group: "CS-21-K" }, replies: 8, lastActivity: "3d ago", tags: ["жильё", "аренда"] },
  { id: "f5", category: "Учёба", title: "Полезные ресурсы для изучения React и Next.js", author: { name: "Омаров Б.", group: "IT-22-K" }, replies: 19, lastActivity: "5h ago", tags: ["react", "nextjs", "ресурсы"] },
  { id: "f6", category: "Общее", title: "Отзывы о стажировках в IT-компаниях Астаны", author: { name: "Байжанов Т.", group: "SE-22-B" }, replies: 34, lastActivity: "2d ago", tags: ["стажировка", "работа"] },
];

export const CATEGORIES = [
  "Электроника", "Учёба", "Одежда", "Услуги", "Документы", "Аксессуары", "Другое"
];

export function formatPrice(price: number): string {
  return price.toLocaleString("ru-KZ") + " ₸";
}

export function getTypeLabel(type: ListingType): string {
  const labels: Record<ListingType, string> = {
    sell: "Продажа",
    buy: "Покупка",
    service: "Услуга",
    lost: "Потеряно",
    found: "Найдено",
  };
  return labels[type];
}

export function getTypeColor(type: ListingType): string {
  const colors: Record<ListingType, string> = {
    sell: "ck-badge-sell",
    buy: "ck-badge-buy",
    service: "ck-badge-service",
    lost: "ck-badge-lost",
    found: "ck-badge-found",
  };
  return colors[type];
}

export function getStripeColor(type: ListingType): string {
  const colors: Record<ListingType, string> = {
    sell: "bg-primary",
    buy: "bg-sky-400",
    service: "bg-purple-400",
    lost: "bg-red-400",
    found: "bg-green-400",
  };
  return colors[type];
}
