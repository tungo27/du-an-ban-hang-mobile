import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

let db: SQLite.SQLiteDatabase | null = null;
let useAsyncStorageFallback = Platform.OS === 'web';

export type Category = {
  id: number;
  name: string;
  img?: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  img: string;
  categoryId: number;
  description?: string;
  rating?: number;
  soldCount?: number;
};

export type User = {
  id: number;
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'user' | string;
  isBlocked?: number | boolean;
};

export type CartItem = {
  productId: number;
  productName: string;
  price: number;
  img: string;
  quantity: number;
};

export type OrderItem = {
  productId: number;
  productName: string;
  price: number;
  img: string;
  quantity: number;
};

export type Order = {
  id: number;
  userId: number;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

// Danh sách ảnh mẫu tiện lợi để chọn nhanh khi thêm/sửa Loại hoặc Sản phẩm
export const PRESET_IMAGES = [
  {
    label: 'Áo sơ mi',
    value: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80',
  },
  {
    label: 'Giày Sneaker',
    value: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
  },
  {
    label: 'Balo Laptop',
    value: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
  },
  {
    label: 'Mũ lưỡi trai',
    value: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80',
  },
  {
    label: 'Túi xách da',
    value: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80',
  },
  {
    label: 'Áo thun',
    value: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
  },
  {
    label: 'Quần Jeans',
    value: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
  },
  {
    label: 'Đồng hồ',
    value: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
  },
  {
    label: 'Áo khoác',
    value: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
  },
  {
    label: 'Kính mát',
    value: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80',
  },
];

// Dữ liệu mẫu danh mục mở rộng (8 danh mục đa dạng tại Ngô Minh Tú Store)
const initialCategories: Category[] = [
  {
    id: 1,
    name: 'Áo Thời Trang',
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&q=80',
  },
  {
    id: 2,
    name: 'Giày Thể Thao',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
  },
  {
    id: 3,
    name: 'Balo & Cặp',
    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80',
  },
  {
    id: 4,
    name: 'Mũ & Nón',
    img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&q=80',
  },
  {
    id: 5,
    name: 'Túi Xách & Ví',
    img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80',
  },
  {
    id: 6,
    name: 'Quần Jeans & Kaki',
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&q=80',
  },
  {
    id: 7,
    name: 'Áo Khoác & Hoodie',
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80',
  },
  {
    id: 8,
    name: 'Đồng Hồ & Phụ Kiện',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80',
  },
];

// Dữ liệu mẫu sản phẩm phong phú (28 sản phẩm trải rộng các phân khúc giá từ 95.000đ đến 1.890.000đ)
const initialProducts: Product[] = [
  // --- Danh mục 1: Áo Thời Trang ---
  {
    id: 1,
    name: 'Áo sơ mi Oxford Slimfit Minh Tú',
    price: 250000,
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80',
    categoryId: 1,
    description:
      'Áo sơ mi Oxford chất liệu 100% cotton cao cấp tại Ngô Minh Tú Store, thoáng mát, chống nhăn, form dáng Slimfit trẻ trung lịch lãm.',
    rating: 4.9,
    soldCount: 420,
  },
  {
    id: 2,
    name: 'Áo thun Cotton Basic Unisex Minh Tú',
    price: 165000,
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
    categoryId: 1,
    description:
      'Áo thun cổ tròn form suông rộng rãi, vải 100% Cotton 2 chiều dày dặn 250gsm, thấm hút mồ hôi tốt, không xù lông.',
    rating: 4.8,
    soldCount: 680,
  },
  {
    id: 3,
    name: 'Áo Polo Nam Pique Cao Cấp Minh Tú',
    price: 295000,
    img: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500&q=80',
    categoryId: 1,
    description:
      'Áo Polo vải cá sấu Pique co giãn 4 chiều, bo cổ dệt sắc nét, phù hợp đi làm công sở và dạo phố cuối tuần.',
    rating: 4.8,
    soldCount: 310,
  },
  {
    id: 4,
    name: 'Áo sơ mi Linen Cộc Tay Mùa Hè',
    price: 220000,
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80',
    categoryId: 1,
    description:
      'Áo sơ mi đũi Linen mềm nhẹ, thoáng khí, mang phong cách Hàn Quốc trẻ trung năng động tại Ngô Minh Tú Store.',
    rating: 4.7,
    soldCount: 195,
  },

  // --- Danh mục 2: Giày Thể Thao ---
  {
    id: 5,
    name: 'Giày Sneaker Retro Red Sport Minh Tú',
    price: 1100000,
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    categoryId: 2,
    description:
      'Giày thể thao nam nữ phong cách năng động, đế đệm khí êm ái chống trơn trượt, trọng lượng siêu nhẹ thích hợp chạy bộ.',
    rating: 4.9,
    soldCount: 540,
  },
  {
    id: 6,
    name: 'Giày Sneaker Trắng Classic Minimalist',
    price: 650000,
    img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
    categoryId: 2,
    description:
      'Giày Sneaker da microfiber trắng tinh tế, dễ phối cùng quần jeans, quần âu hoặc chân váy, đế cao su đúc nguyên khối.',
    rating: 4.8,
    soldCount: 490,
  },
  {
    id: 7,
    name: 'Giày Chạy Bộ UltraBoost Pro Minh Tú',
    price: 1450000,
    img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80',
    categoryId: 2,
    description:
      'Giày chạy bộ chuyên nghiệp với thân vải dệt Primeknit ôm chân thoáng khí và đế hoàn trả năng lượng vượt trội.',
    rating: 5.0,
    soldCount: 275,
  },
  {
    id: 8,
    name: 'Giày Lười Canvas Streetwear',
    price: 380000,
    img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80',
    categoryId: 2,
    description:
      'Giày vải Canvas bền đẹp, thiết kế trẻ trung tiện lợi xỏ chân nhanh chóng cho sinh viên và dân văn phòng.',
    rating: 4.7,
    soldCount: 360,
  },

  // --- Danh mục 3: Balo & Cặp ---
  {
    id: 9,
    name: 'Balo Laptop Chống Nước 15.6 inch Minh Tú',
    price: 490000,
    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
    categoryId: 3,
    description:
      'Balo công sở và du lịch nhiều ngăn tiện lợi, tích hợp cổng sạc USB, chất vải Oxford chống thấm nước tối ưu.',
    rating: 4.8,
    soldCount: 330,
  },
  {
    id: 10,
    name: 'Balo Du Lịch Phượt Đa Năng 40L',
    price: 680000,
    img: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500&q=80',
    categoryId: 3,
    description:
      'Balo du lịch dung tích lớn 40L có đệm lưng thoáng khí, đai trợ lực ngực và hông giúp di chuyển đường dài thoải mái.',
    rating: 4.9,
    soldCount: 180,
  },
  {
    id: 11,
    name: 'Balo Mini Thời Trang Hàn Quốc',
    price: 260000,
    img: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=500&q=80',
    categoryId: 3,
    description:
      'Balo nhỏ gọn xinh xắn đựng vừa iPad, sổ tay và phụ kiện cá nhân khi đi học thêm hoặc dạo phố.',
    rating: 4.7,
    soldCount: 410,
  },

  // --- Danh mục 4: Mũ & Nón ---
  {
    id: 12,
    name: 'Mũ lưỡi trai Phong Cách Vintage Minh Tú',
    price: 120000,
    img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80',
    categoryId: 4,
    description:
      'Mũ lưỡi trai chất liệu kaki cotton mềm thấm hút mồ hôi, khóa đồng phía sau dễ dàng điều chỉnh kích cỡ.',
    rating: 4.7,
    soldCount: 520,
  },
  {
    id: 13,
    name: 'Mũ Bucket Vành Tròn Streetwear',
    price: 135000,
    img: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500&q=80',
    categoryId: 4,
    description:
      'Nón tai bèo Bucket 2 mặt đội cực chất, che nắng tốt khi đi biển, dã ngoại và chụp ảnh ngoài trời.',
    rating: 4.6,
    soldCount: 290,
  },
  {
    id: 14,
    name: 'Mũ Thể Thao Chống Nắng Siêu Nhẹ',
    price: 95000,
    img: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500&q=80',
    categoryId: 4,
    description:
      'Mũ thể thao vải dù lỗ thoáng khí chuyên dụng cho chạy bộ, đánh cầu lông, tennis ngoài trời.',
    rating: 4.8,
    soldCount: 615,
  },

  // --- Danh mục 5: Túi Xách & Ví ---
  {
    id: 15,
    name: 'Túi xách da nữ Cao Cấp Ngô Minh Tú',
    price: 980000,
    img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80',
    categoryId: 5,
    description:
      'Túi xách da PU cao cấp bề mặt mềm mịn, khóa mạ vàng sang trọng, kiểu dáng thanh lịch phân phối bởi Ngô Minh Tú Store.',
    rating: 5.0,
    soldCount: 245,
  },
  {
    id: 16,
    name: 'Túi Đeo Chéo Nam Da Bò Saffiano',
    price: 550000,
    img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',
    categoryId: 5,
    description:
      'Túi đeo chéo ngực nam chất liệu da chống xước, chống thấm nước nhẹ, thiết kế tối giản hiện đại.',
    rating: 4.8,
    soldCount: 310,
  },
  {
    id: 17,
    name: 'Ví Da Nam Cầm Tay Bifold Minh Tú',
    price: 195000,
    img: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80',
    categoryId: 5,
    description:
      'Ví da nam dáng ngang nhỏ gọn với 8 ngăn đựng thẻ ATM, 2 ngăn tiền mặt và đường chỉ khâu tay tỉ mỉ.',
    rating: 4.9,
    soldCount: 730,
  },
  {
    id: 18,
    name: 'Túi Tote Vải Canvas In Chữ Minh Tú',
    price: 110000,
    img: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&q=80',
    categoryId: 5,
    description:
      'Túi vải Tote thân thiện môi trường, có khóa kéo miệng túi và ngăn nhỏ bên trong, đựng vừa laptop 14 inch.',
    rating: 4.7,
    soldCount: 840,
  },

  // --- Danh mục 6: Quần Jeans & Kaki ---
  {
    id: 19,
    name: 'Quần Jeans Nam Slimfit Co Giãn Minh Tú',
    price: 420000,
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
    categoryId: 6,
    description:
      'Quần Jeans denim xanh chàm co giãn nhẹ, giữ form tốt, không phai màu khi giặt máy.',
    rating: 4.8,
    soldCount: 390,
  },
  {
    id: 20,
    name: 'Quần Kaki Công Sở Chống Nhăn Minh Tú',
    price: 350000,
    img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80',
    categoryId: 6,
    description:
      'Quần dài Kaki ống đứng lịch sự, chất vải cotton pha spandex mềm mại, thoải mái khi ngồi làm việc cả ngày.',
    rating: 4.8,
    soldCount: 460,
  },
  {
    id: 21,
    name: 'Quần Short Kaki Nam Mùa Hè',
    price: 185000,
    img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80',
    categoryId: 6,
    description:
      'Quần short ngang gối trẻ trung năng động, cạp chun phối dây rút tiện lợi cho những chuyến du lịch biển.',
    rating: 4.7,
    soldCount: 510,
  },

  // --- Danh mục 7: Áo Khoác & Hoodie ---
  {
    id: 22,
    name: 'Áo Khoác Da Biker Jacket Ngô Minh Tú',
    price: 1250000,
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
    categoryId: 7,
    description:
      'Áo khoác da phong cách Biker mạnh mẽ, lớp lót lụa mịn bên trong chắn gió giữ ấm tuyệt vời.',
    rating: 4.9,
    soldCount: 165,
  },
  {
    id: 23,
    name: 'Áo Hoodie Nỉ Bông Oversize Minh Tú',
    price: 340000,
    img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80',
    categoryId: 7,
    description:
      'Áo Hoodie nỉ ngoại dày dặn ấm áp, mũ 2 lớp đứng form, túi kangaroo phía trước rộng rãi.',
    rating: 4.8,
    soldCount: 620,
  },
  {
    id: 24,
    name: 'Áo Khoác Gió 2 Lớp Chống Tia UV',
    price: 275000,
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80',
    categoryId: 7,
    description:
      'Áo khoác dù 2 lớp trượt nước nhẹ, chống nắng UPF50+, gấp gọn dễ dàng bỏ vào cốp xe hoặc balo.',
    rating: 4.8,
    soldCount: 740,
  },

  // --- Danh mục 8: Đồng Hồ & Phụ Kiện ---
  {
    id: 25,
    name: 'Đồng Hồ Nam Quartz Dây Da Minh Tú',
    price: 1890000,
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    categoryId: 8,
    description:
      'Đồng hồ mặt kính Sapphire chống trầy xước, máy Quartz Nhật Bản chính xác, chống nước 5ATM.',
    rating: 5.0,
    soldCount: 215,
  },
  {
    id: 26,
    name: 'Kính Mát Phân Cực Polarized UV400',
    price: 320000,
    img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80',
    categoryId: 8,
    description:
      'Kính râm thời trang tròng Polarized chống chói lóa và bảo vệ mắt khỏi 100% tia cực tím UV400.',
    rating: 4.8,
    soldCount: 380,
  },
  {
    id: 27,
    name: 'Thắt Lưng Da Bò Khóa Tự Động Minh Tú',
    price: 240000,
    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
    categoryId: 8,
    description:
      'Dây lưng nam da bò thật nguyên miếng, mặt khóa hợp kim chống gỉ sét sang trọng lịch lãm.',
    rating: 4.9,
    soldCount: 450,
  },
  {
    id: 28,
    name: 'Combo 5 Đôi Tất Thể Thao Cổ Ngắn',
    price: 99000,
    img: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=500&q=80',
    categoryId: 8,
    description:
      'Tất vớ cotton kháng khuẩn khử mùi, co giãn 4 chiều êm chân khi mang giày sneaker cả ngày.',
    rating: 4.9,
    soldCount: 950,
  },
];

// Đơn hàng mẫu khởi tạo sẵn để kiểm tra nhanh Lịch sử đơn hàng & Quản trị đơn hàng của Admin
const initialOrders: Order[] = [
  {
    id: 1001,
    userId: 3,
    customerName: 'Ngô Minh Tú',
    phone: '0988666888',
    address: '68 Điện Biên Phủ, Thanh Khê, Đà Nẵng',
    note: 'Giao giờ hành chính giúp mình',
    paymentMethod: 'COD (Thanh toán khi nhận hàng)',
    totalAmount: 740000,
    status: 'Chờ xác nhận',
    createdAt: '09/11/2026 14:20',
    items: [
      {
        productId: 1,
        productName: 'Áo sơ mi Oxford Slimfit Minh Tú',
        price: 250000,
        img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80',
        quantity: 1,
      },
      {
        productId: 9,
        productName: 'Balo Laptop Chống Nước 15.6 inch Minh Tú',
        price: 490000,
        img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
        quantity: 1,
      },
    ],
  },
  {
    id: 1002,
    userId: 3,
    customerName: 'Ngô Minh Tú',
    phone: '0988666888',
    address: '68 Điện Biên Phủ, Thanh Khê, Đà Nẵng',
    note: 'Gọi trước khi giao 15 phút',
    paymentMethod: 'Chuyển khoản ngân hàng',
    totalAmount: 1100000,
    status: 'Đang giao hàng',
    createdAt: '10/11/2026 08:15',
    items: [
      {
        productId: 5,
        productName: 'Giày Sneaker Retro Red Sport Minh Tú',
        price: 1100000,
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
        quantity: 1,
      },
    ],
  },
];

// Yêu cầu B.1: Khởi tạo database với tài khoản Admin có sẵn (mang tên Ngô Minh Tú)
const initialUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    password: '123',
    fullName: 'Ngô Minh Tú (Admin)',
    email: 'admin.ngominhtu@gmail.com',
    phone: '0988111222',
    address: '123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
    role: 'admin',
  },
  {
    id: 2,
    username: 'minhtu_admin',
    password: '123',
    fullName: 'Ngô Minh Tú (Quản trị viên)',
    email: 'minhtu.admin@gmail.com',
    phone: '0988222333',
    address: '45 Lê Duẩn, Hải Châu, Đà Nẵng',
    role: 'admin',
  },
  {
    id: 3,
    username: 'ngominh_tu',
    password: '123',
    fullName: 'Ngô Minh Tú',
    email: 'ngominhtu@gmail.com',
    phone: '0988666888',
    address: '68 Điện Biên Phủ, Thanh Khê, Đà Nẵng',
    role: 'user',
  },
];

const ASYNC_KEYS = {
  CATEGORIES: '@minhtu_categories_b14_v3',
  PRODUCTS: '@minhtu_products_b14_v3',
  USERS: '@minhtu_users_b14_v3',
  CURRENT_USER: '@minhtu_current_user_b14_v3',
  CART: '@minhtu_cart_b14_v3',
  CART_GUEST: '@minhtu_cart_guest_b14_v3',
  CART_USER_PREFIX: '@minhtu_cart_user_b14_v3_',
  ORDERS: '@minhtu_orders_b14_v3',
};

// ==================== KHỞI TẠO CƠ SỞ DỮ LIỆU ====================
const getDb = async (): Promise<SQLite.SQLiteDatabase | null> => {
  if (useAsyncStorageFallback) return null;
  if (db) return db;
  try {
    db = await SQLite.openDatabaseAsync('minhTuStore_b14_v3.db');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    return db;
  } catch (err) {
    console.warn('[getDb] Không mở được SQLite native, chuyển sang AsyncStorage:', err);
    useAsyncStorageFallback = true;
    return null;
  }
};

export const initDatabase = async (onSuccess?: () => void): Promise<void> => {
  try {
    const database = await getDb();

    if (database) {
      await database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.execAsync(`
          PRAGMA foreign_keys = ON;
          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            img TEXT
          );
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            price REAL,
            img TEXT,
            categoryId INTEGER,
            description TEXT,
            rating REAL,
            soldCount INTEGER,
            FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
          );
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            fullName TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            role TEXT,
            isBlocked INTEGER DEFAULT 0
          );
          CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            customerName TEXT,
            phone TEXT,
            address TEXT,
            note TEXT,
            paymentMethod TEXT,
            totalAmount REAL,
            status TEXT,
            createdAt TEXT,
            itemsJson TEXT
          );
        `);

        try {
          await transaction.execAsync('ALTER TABLE users ADD COLUMN isBlocked INTEGER DEFAULT 0;');
        } catch (_) {}

        for (const cat of initialCategories) {
          await transaction.runAsync(
            'INSERT OR IGNORE INTO categories (id, name, img) VALUES (?, ?, ?)',
            [cat.id, cat.name, cat.img || '']
          );
        }

        for (const prod of initialProducts) {
          await transaction.runAsync(
            'INSERT OR IGNORE INTO products (id, name, price, img, categoryId, description, rating, soldCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              prod.id,
              prod.name,
              prod.price,
              prod.img,
              prod.categoryId,
              prod.description || '',
              prod.rating || 5.0,
              prod.soldCount || 0,
            ]
          );
        }

        for (const u of initialUsers) {
          await transaction.runAsync(
            `INSERT INTO users (username, password, fullName, email, phone, address, role)
             SELECT ?, ?, ?, ?, ?, ?, ?
             WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = ?)`,
            [
              u.username,
              u.password,
              u.fullName,
              u.email || '',
              u.phone || '',
              u.address || '',
              u.role,
              u.username,
            ]
          );
        }

        for (const ord of initialOrders) {
          await transaction.runAsync(
            `INSERT OR IGNORE INTO orders (id, userId, customerName, phone, address, note, paymentMethod, totalAmount, status, createdAt, itemsJson)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              ord.id,
              ord.userId,
              ord.customerName,
              ord.phone,
              ord.address,
              ord.note || '',
              ord.paymentMethod,
              ord.totalAmount,
              ord.status,
              ord.createdAt,
              JSON.stringify(ord.items),
            ]
          );
        }
      });
    } else {
      const existingCats = await AsyncStorage.getItem(ASYNC_KEYS.CATEGORIES);
      if (!existingCats) {
        await AsyncStorage.setItem(ASYNC_KEYS.CATEGORIES, JSON.stringify(initialCategories));
      }

      const existingProds = await AsyncStorage.getItem(ASYNC_KEYS.PRODUCTS);
      if (!existingProds) {
        await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(initialProducts));
      }

      const existingUsers = await AsyncStorage.getItem(ASYNC_KEYS.USERS);
      if (!existingUsers) {
        await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(initialUsers));
      }

      const existingOrders = await AsyncStorage.getItem(ASYNC_KEYS.ORDERS);
      if (!existingOrders) {
        await AsyncStorage.setItem(ASYNC_KEYS.ORDERS, JSON.stringify(initialOrders));
      }
    }
  } catch (error) {
    console.error('[initDatabase] Lỗi:', error);
    useAsyncStorageFallback = true;
    try {
      const existingProds = await AsyncStorage.getItem(ASYNC_KEYS.PRODUCTS);
      if (!existingProds) {
        await AsyncStorage.setItem(ASYNC_KEYS.CATEGORIES, JSON.stringify(initialCategories));
        await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(initialProducts));
        await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(initialUsers));
        await AsyncStorage.setItem(ASYNC_KEYS.ORDERS, JSON.stringify(initialOrders));
      }
    } catch (_) {}
  } finally {
    onSuccess?.();
  }
};

// ==================== 1. QUẢN TRỊ LOẠI SẢN PHẨM (CATEGORIES) ====================
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const database = await getDb();
    if (database) {
      return await database.getAllAsync<Category>('SELECT * FROM categories ORDER BY id ASC');
    }
    const json = await AsyncStorage.getItem(ASYNC_KEYS.CATEGORIES);
    return json ? JSON.parse(json) : initialCategories;
  } catch (error) {
    console.error('[fetchCategories] Lỗi:', error);
    return initialCategories;
  }
};

export const addCategory = async (name: string, img?: string): Promise<boolean> => {
  try {
    const cleanName = name.trim();
    const cleanImg = img?.trim() || PRESET_IMAGES[0].value;
    const database = await getDb();

    if (database) {
      await database.runAsync('INSERT INTO categories (name, img) VALUES (?, ?)', [
        cleanName,
        cleanImg,
      ]);
      return true;
    }

    const cats = await fetchCategories();
    const nextId = cats.length > 0 ? Math.max(...cats.map((c) => c.id)) + 1 : 1;
    const updated = [...cats, { id: nextId, name: cleanName, img: cleanImg }];
    await AsyncStorage.setItem(ASYNC_KEYS.CATEGORIES, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[addCategory] Lỗi:', error);
    return false;
  }
};

export const updateCategory = async (
  id: number,
  name: string,
  img?: string
): Promise<boolean> => {
  try {
    const cleanName = name.trim();
    const cleanImg = img?.trim() || PRESET_IMAGES[0].value;
    const database = await getDb();

    if (database) {
      await database.runAsync('UPDATE categories SET name = ?, img = ? WHERE id = ?', [
        cleanName,
        cleanImg,
        id,
      ]);
      return true;
    }

    const cats = await fetchCategories();
    const updated = cats.map((c) =>
      c.id === id ? { ...c, name: cleanName, img: cleanImg } : c
    );
    await AsyncStorage.setItem(ASYNC_KEYS.CATEGORIES, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[updateCategory] Lỗi:', error);
    return false;
  }
};

// Ràng buộc Cascade Delete: Xóa loại sản phẩm thì xóa toàn bộ sản phẩm thuộc loại đó
export const deleteCategory = async (id: number): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.withExclusiveTransactionAsync(async (tx) => {
        await tx.runAsync('DELETE FROM products WHERE categoryId = ?', [id]);
        await tx.runAsync('DELETE FROM categories WHERE id = ?', [id]);
      });
      return true;
    }

    const cats = await fetchCategories();
    const prods = await fetchProducts();
    const filteredCats = cats.filter((c) => c.id !== id);
    const filteredProds = prods.filter((p) => p.categoryId !== id);

    await AsyncStorage.setItem(ASYNC_KEYS.CATEGORIES, JSON.stringify(filteredCats));
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(filteredProds));
    return true;
  } catch (error) {
    console.error('[deleteCategory] Lỗi:', error);
    return false;
  }
};

// ==================== 2. QUẢN TRỊ SẢN PHẨM (PRODUCTS) ====================
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const database = await getDb();
    if (database) {
      return await database.getAllAsync<Product>('SELECT * FROM products ORDER BY id DESC');
    }
    const json = await AsyncStorage.getItem(ASYNC_KEYS.PRODUCTS);
    return json ? JSON.parse(json) : initialProducts;
  } catch (error) {
    console.error('[fetchProducts] Lỗi:', error);
    return initialProducts;
  }
};

export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    const prods = await fetchProducts();
    return prods.find((p) => p.id === id) || null;
  } catch (error) {
    console.error('[getProductById] Lỗi:', error);
    return null;
  }
};

export const fetchProductsByCategory = async (categoryId: number): Promise<Product[]> => {
  try {
    if (categoryId === 0) {
      return await fetchProducts();
    }
    const database = await getDb();
    if (database) {
      return await database.getAllAsync<Product>(
        'SELECT * FROM products WHERE categoryId = ? ORDER BY id DESC',
        [categoryId]
      );
    }
    const prods = await fetchProducts();
    return prods.filter((p) => p.categoryId === categoryId);
  } catch (error) {
    console.error('[fetchProductsByCategory] Lỗi:', error);
    return [];
  }
};

export const searchProducts = async (keyword: string): Promise<Product[]> => {
  try {
    const trimmed = keyword.trim().toLowerCase();
    const prods = await fetchProducts();
    if (!trimmed) return prods;
    return prods.filter((p) => p.name.toLowerCase().includes(trimmed));
  } catch (error) {
    console.error('[searchProducts] Lỗi:', error);
    return [];
  }
};

export const addProduct = async (payload: {
  name: string;
  price: number;
  img: string;
  categoryId: number;
  description?: string;
}): Promise<boolean> => {
  try {
    const database = await getDb();
    const cleanImg = payload.img.trim() || PRESET_IMAGES[0].value;
    const desc =
      payload.description?.trim() ||
      'Sản phẩm chính hãng phân phối tại Ngô Minh Tú Store.';

    if (database) {
      await database.runAsync(
        'INSERT INTO products (name, price, img, categoryId, description, rating, soldCount) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [payload.name.trim(), payload.price, cleanImg, payload.categoryId, desc, 5.0, 10]
      );
      return true;
    }

    const prods = await fetchProducts();
    const nextId = prods.length > 0 ? Math.max(...prods.map((p) => p.id)) + 1 : 1;
    const newProd: Product = {
      id: nextId,
      name: payload.name.trim(),
      price: payload.price,
      img: cleanImg,
      categoryId: payload.categoryId,
      description: desc,
      rating: 5.0,
      soldCount: 10,
    };
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify([newProd, ...prods]));
    return true;
  } catch (error) {
    console.error('[addProduct] Lỗi:', error);
    return false;
  }
};

export const updateProduct = async (
  id: number,
  payload: {
    name: string;
    price: number;
    img: string;
    categoryId: number;
    description?: string;
  }
): Promise<boolean> => {
  try {
    const database = await getDb();
    const cleanImg = payload.img.trim() || PRESET_IMAGES[0].value;
    const desc =
      payload.description?.trim() ||
      'Sản phẩm chính hãng phân phối tại Ngô Minh Tú Store.';

    if (database) {
      await database.runAsync(
        'UPDATE products SET name = ?, price = ?, img = ?, categoryId = ?, description = ? WHERE id = ?',
        [payload.name.trim(), payload.price, cleanImg, payload.categoryId, desc, id]
      );
      return true;
    }

    const prods = await fetchProducts();
    const updated = prods.map((p) =>
      p.id === id
        ? {
            ...p,
            name: payload.name.trim(),
            price: payload.price,
            img: cleanImg,
            categoryId: payload.categoryId,
            description: desc,
          }
        : p
    );
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[updateProduct] Lỗi:', error);
    return false;
  }
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.runAsync('DELETE FROM products WHERE id = ?', [id]);
      return true;
    }

    const prods = await fetchProducts();
    const filtered = prods.filter((p) => p.id !== id);
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[deleteProduct] Lỗi:', error);
    return false;
  }
};

// ==================== 3. QUẢN TRỊ USER & XÁC THỰC (USERS & AUTH) ====================
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const database = await getDb();
    if (database) {
      return await database.getAllAsync<User>('SELECT * FROM users ORDER BY id ASC');
    }
    const json = await AsyncStorage.getItem(ASYNC_KEYS.USERS);
    return json ? JSON.parse(json) : initialUsers;
  } catch (error) {
    console.error('[fetchUsers] Lỗi:', error);
    return initialUsers;
  }
};

export const registerUser = async (payload: {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
}): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const cleanUsername = payload.username.trim().toLowerCase();
    const users = await fetchUsers();

    const existed = users.some((u) => u.username.toLowerCase() === cleanUsername);
    if (existed) {
      return {
        success: false,
        message: 'Tên đăng nhập này đã tồn tại! Vui lòng chọn tên khác.',
      };
    }

    const cleanEmail = payload.email?.trim().toLowerCase() || '';
    if (cleanEmail) {
      const emailExisted = users.some(
        (u) => (u.email || '').trim().toLowerCase() === cleanEmail
      );
      if (emailExisted) {
        return {
          success: false,
          message: 'Email này đã được đăng ký! Vui lòng sử dụng email khác.',
        };
      }
    }

    const database = await getDb();
    if (database) {
      const result = await database.runAsync(
        'INSERT INTO users (username, password, fullName, email, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          cleanUsername,
          payload.password,
          payload.fullName.trim(),
          payload.email?.trim() || '',
          payload.phone?.trim() || '',
          payload.address?.trim() || '',
          'user',
        ]
      );
      const newUser: User = {
        id: result.lastInsertRowId,
        username: cleanUsername,
        password: payload.password,
        fullName: payload.fullName.trim(),
        email: payload.email?.trim() || '',
        phone: payload.phone?.trim() || '',
        address: payload.address?.trim() || '',
        role: 'user',
      };
      return {
        success: true,
        message: 'Đăng ký tài khoản thành công!',
        user: newUser,
      };
    } else {
      const nextId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
      const newUser: User = {
        id: nextId,
        username: cleanUsername,
        password: payload.password,
        fullName: payload.fullName.trim(),
        email: payload.email?.trim() || '',
        phone: payload.phone?.trim() || '',
        address: payload.address?.trim() || '',
        role: 'user',
      };
      users.push(newUser);
      await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(users));
      return {
        success: true,
        message: 'Đăng ký tài khoản thành công!',
        user: newUser,
      };
    }
  } catch (error) {
    console.error('[registerUser] Lỗi:', error);
    return { success: false, message: 'Có lỗi xảy ra khi lưu người dùng vào CSDL.' };
  }
};

export const loginUser = async (
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const cleanUsername = username.trim().toLowerCase();
    const users = await fetchUsers();
    const foundUser = users.find(
      (u) =>
        (u.username.toLowerCase() === cleanUsername ||
          (u.email || '').trim().toLowerCase() === cleanUsername) &&
        u.password === password
    );

    if (!foundUser) {
      return {
        success: false,
        message: 'Sai tên đăng nhập hoặc mật khẩu! Vui lòng kiểm tra lại.',
      };
    }

    if (foundUser.isBlocked === 1 || foundUser.isBlocked === true) {
      return {
        success: false,
        message:
          'Tài khoản của bạn đã bị Quản trị viên chặn (khóa)! Vui lòng liên hệ Ngô Minh Tú Store để được hỗ trợ.',
      };
    }

    await AsyncStorage.setItem(ASYNC_KEYS.CURRENT_USER, JSON.stringify(foundUser));

    // Đồng bộ (Sync) giỏ hàng từ trạng thái Guest vào giỏ hàng của User khi đăng nhập (nếu là khách hàng)
    if (foundUser.role !== 'admin') {
      await syncGuestCartToUserCart(foundUser.id);
    }

    return {
      success: true,
      message: 'Đăng nhập thành công!',
      user: foundUser,
    };
  } catch (error) {
    console.error('[loginUser] Lỗi:', error);
    return { success: false, message: 'Lỗi khi kiểm tra đăng nhập từ CSDL.' };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const json = await AsyncStorage.getItem(ASYNC_KEYS.CURRENT_USER);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('[getCurrentUser] Lỗi:', error);
    return null;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ASYNC_KEYS.CURRENT_USER);
  } catch (error) {
    console.error('[logoutUser] Lỗi:', error);
  }
};

// Quản trị User: Cập nhật vai trò (admin <-> user)
export const updateUserRole = async (
  userId: number,
  newRole: 'admin' | 'user'
): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.runAsync('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
    } else {
      const users = await fetchUsers();
      const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
      await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(updated));
    }

    const current = await getCurrentUser();
    if (current && current.id === userId) {
      await AsyncStorage.setItem(
        ASYNC_KEYS.CURRENT_USER,
        JSON.stringify({ ...current, role: newRole })
      );
    }
    return true;
  } catch (error) {
    console.error('[updateUserRole] Lỗi:', error);
    return false;
  }
};

// Quản trị User: Chặn / Mở chặn người dùng (Không xóa user)
export const toggleBlockUser = async (
  userId: number,
  blockStatus: boolean
): Promise<boolean> => {
  try {
    const blockedInt = blockStatus ? 1 : 0;
    const database = await getDb();
    if (database) {
      await database.runAsync('UPDATE users SET isBlocked = ? WHERE id = ?', [
        blockedInt,
        userId,
      ]);
    } else {
      const users = await fetchUsers();
      const updated = users.map((u) =>
        u.id === userId ? { ...u, isBlocked: blockedInt } : u
      );
      await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(updated));
    }

    const current = await getCurrentUser();
    if (current && current.id === userId && blockStatus) {
      await logoutUser();
    }
    return true;
  } catch (error) {
    console.error('[toggleBlockUser] Lỗi:', error);
    return false;
  }
};

// Quản trị User: Xóa user (giữ lại hàm dự phòng nhưng trên UI Admin chỉ dùng Chặn user)
export const deleteUser = async (userId: number): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.runAsync('DELETE FROM users WHERE id = ?', [userId]);
      return true;
    }

    const users = await fetchUsers();
    const filtered = users.filter((u) => u.id !== userId);
    await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[deleteUser] Lỗi:', error);
    return false;
  }
};

// Chức năng người dùng: Cập nhật thông tin cá nhân
export const updateUserProfile = async (
  userId: number,
  payload: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    password?: string;
  }
): Promise<{ success: boolean; user?: User }> => {
  try {
    const users = await fetchUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false };

    const newPassword =
      payload.password && payload.password.trim().length > 0
        ? payload.password.trim()
        : target.password;

    const updatedUser: User = {
      ...target,
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      address: payload.address.trim(),
      password: newPassword,
    };

    const database = await getDb();
    if (database) {
      await database.runAsync(
        'UPDATE users SET fullName = ?, email = ?, phone = ?, address = ?, password = ? WHERE id = ?',
        [
          updatedUser.fullName,
          updatedUser.email || '',
          updatedUser.phone || '',
          updatedUser.address || '',
          updatedUser.password,
          userId,
        ]
      );
    } else {
      const updatedList = users.map((u) => (u.id === userId ? updatedUser : u));
      await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(updatedList));
    }

    await AsyncStorage.setItem(ASYNC_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('[updateUserProfile] Lỗi:', error);
    return { success: false };
  }
};

// ==================== 4. GIỎ HÀNG (CART) & SYNC GUEST -> USER ====================
const getActiveCartKey = async (): Promise<string> => {
  const current = await getCurrentUser();
  if (current && current.id > 0) {
    return `${ASYNC_KEYS.CART_USER_PREFIX}${current.id}`;
  }
  return ASYNC_KEYS.CART_GUEST;
};

export const syncGuestCartToUserCart = async (userId: number): Promise<void> => {
  try {
    const guestJson = await AsyncStorage.getItem(ASYNC_KEYS.CART_GUEST);
    const guestItems: CartItem[] = guestJson ? JSON.parse(guestJson) : [];
    if (guestItems.length === 0) return;

    const userCartKey = `${ASYNC_KEYS.CART_USER_PREFIX}${userId}`;
    const userJson = await AsyncStorage.getItem(userCartKey);
    const userItems: CartItem[] = userJson ? JSON.parse(userJson) : [];

    for (const gItem of guestItems) {
      const existingIndex = userItems.findIndex(
        (uItem) => uItem.productId === gItem.productId
      );
      if (existingIndex >= 0) {
        userItems[existingIndex].quantity += gItem.quantity;
      } else {
        userItems.push({ ...gItem });
      }
    }

    await AsyncStorage.setItem(userCartKey, JSON.stringify(userItems));
    await AsyncStorage.removeItem(ASYNC_KEYS.CART_GUEST);
  } catch (error) {
    console.error('[syncGuestCartToUserCart] Lỗi đồng bộ giỏ hàng:', error);
  }
};

export const fetchCartItems = async (): Promise<CartItem[]> => {
  try {
    const key = await getActiveCartKey();
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('[fetchCartItems] Lỗi:', error);
    return [];
  }
};

export const addToCart = async (
  product: Product,
  quantity: number = 1
): Promise<CartItem[]> => {
  try {
    const key = await getActiveCartKey();
    const items = await fetchCartItems();
    const existingIndex = items.findIndex((item) => item.productId === product.id);

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        img: product.img,
        quantity,
      });
    }

    await AsyncStorage.setItem(key, JSON.stringify(items));
    return items;
  } catch (error) {
    console.error('[addToCart] Lỗi:', error);
    return [];
  }
};

export const updateCartItemQuantity = async (
  productId: number,
  quantity: number
): Promise<CartItem[]> => {
  try {
    const key = await getActiveCartKey();
    const items = await fetchCartItems();
    let updated: CartItem[];
    if (quantity <= 0) {
      updated = items.filter((item) => item.productId !== productId);
    } else {
      updated = items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    }
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('[updateCartItemQuantity] Lỗi:', error);
    return [];
  }
};

export const removeFromCart = async (productId: number): Promise<CartItem[]> => {
  try {
    const key = await getActiveCartKey();
    const items = await fetchCartItems();
    const updated = items.filter((item) => item.productId !== productId);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('[removeFromCart] Lỗi:', error);
    return [];
  }
};

export const clearCart = async (): Promise<void> => {
  try {
    const key = await getActiveCartKey();
    await AsyncStorage.setItem(key, JSON.stringify([]));
  } catch (error) {
    console.error('[clearCart] Lỗi:', error);
  }
};

// ==================== 5. ĐƠN HÀNG & LỊCH SỬ MUA HÀNG (ORDERS) ====================
export const fetchOrders = async (userId?: number): Promise<Order[]> => {
  try {
    const database = await getDb();
    let allOrders: Order[] = [];

    if (database) {
      const rows = await database.getAllAsync<{
        id: number;
        userId: number;
        customerName: string;
        phone: string;
        address: string;
        note: string;
        paymentMethod: string;
        totalAmount: number;
        status: string;
        createdAt: string;
        itemsJson: string;
      }>('SELECT * FROM orders ORDER BY id DESC');

      allOrders = rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        customerName: r.customerName,
        phone: r.phone,
        address: r.address,
        note: r.note,
        paymentMethod: r.paymentMethod,
        totalAmount: r.totalAmount,
        status: r.status,
        createdAt: r.createdAt,
        items: r.itemsJson ? JSON.parse(r.itemsJson) : [],
      }));
    } else {
      const json = await AsyncStorage.getItem(ASYNC_KEYS.ORDERS);
      allOrders = json ? JSON.parse(json) : [];
    }

    if (userId !== undefined) {
      return allOrders.filter((o) => o.userId === userId);
    }
    return allOrders;
  } catch (error) {
    console.error('[fetchOrders] Lỗi:', error);
    return [];
  }
};

export const createOrder = async (payload: {
  userId: number;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: string;
  items: OrderItem[];
}): Promise<{ success: boolean; order?: Order }> => {
  try {
    const totalAmount = payload.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const createdAt = new Date().toLocaleString('vi-VN');
    const status = 'Đã xác nhận - Đang giao hàng';
    const itemsJson = JSON.stringify(payload.items);

    const database = await getDb();
    if (database) {
      const res = await database.runAsync(
        `INSERT INTO orders (userId, customerName, phone, address, note, paymentMethod, totalAmount, status, createdAt, itemsJson)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.userId,
          payload.customerName.trim(),
          payload.phone.trim(),
          payload.address.trim(),
          payload.note?.trim() || '',
          payload.paymentMethod,
          totalAmount,
          status,
          createdAt,
          itemsJson,
        ]
      );
      const newOrder: Order = {
        id: res.lastInsertRowId,
        userId: payload.userId,
        customerName: payload.customerName.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        note: payload.note?.trim() || '',
        paymentMethod: payload.paymentMethod,
        totalAmount,
        status,
        createdAt,
        items: payload.items,
      };
      await clearCart();
      return { success: true, order: newOrder };
    } else {
      const existing = await fetchOrders();
      const nextId =
        existing.length > 0 ? Math.max(...existing.map((o) => o.id)) + 1 : 1001;
      const newOrder: Order = {
        id: nextId,
        userId: payload.userId,
        customerName: payload.customerName.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        note: payload.note?.trim() || '',
        paymentMethod: payload.paymentMethod,
        totalAmount,
        status,
        createdAt,
        items: payload.items,
      };
      await AsyncStorage.setItem(
        ASYNC_KEYS.ORDERS,
        JSON.stringify([newOrder, ...existing])
      );
      await clearCart();
      return { success: true, order: newOrder };
    }
  } catch (error) {
    console.error('[createOrder] Lỗi:', error);
    return { success: false };
  }
};

export const updateOrderStatus = async (
  orderId: number,
  newStatus: string
): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.runAsync('UPDATE orders SET status = ? WHERE id = ?', [
        newStatus,
        orderId,
      ]);
      return true;
    }

    const existing = await fetchOrders();
    const updated = existing.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    await AsyncStorage.setItem(ASYNC_KEYS.ORDERS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[updateOrderStatus] Lỗi:', error);
    return false;
  }
};


// ==================== 6. CÁC HÀM HELPER BỔ SUNG & ALIAS ====================
export const getProductImageSource = (img?: string) => {
  if (!img || img.startsWith('local:')) {
    return require('../../assets/images/hinh1.jpg');
  }
  return { uri: img };
};

export const searchAndFilterProducts = async (
  keyword: string,
  categoryId?: number,
  minPrice?: number,
  maxPrice?: number
): Promise<Product[]> => {
  const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
  const catMap = new Map<number, string>();
  cats.forEach((c) => catMap.set(c.id, c.name.toLowerCase()));

  const kw = keyword.trim().toLowerCase();
  return prods.filter((p) => {
    const matchCat = categoryId === undefined || p.categoryId === categoryId;
    const catName = catMap.get(p.categoryId) || '';
    const matchKw =
      !kw ||
      p.name.toLowerCase().includes(kw) ||
      catName.includes(kw) ||
      (p.description || '').toLowerCase().includes(kw);
    const matchMin =
      minPrice === undefined || isNaN(minPrice) || p.price >= minPrice;
    const matchMax =
      maxPrice === undefined || isNaN(maxPrice) || p.price <= maxPrice;
    return matchCat && matchKw && matchMin && matchMax;
  });
};

export const getCartItemCount = async (): Promise<number> => {
  const items = await fetchCartItems();
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const insertCategory = addCategory;

export const insertProduct = async (
  name: string,
  price: number,
  img: string,
  description: string,
  categoryId: number,
  _soldCount: number = 0
): Promise<boolean> => {
  return addProduct({ name, price, img, categoryId, description });
};
