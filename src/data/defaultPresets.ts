import { BreathingPreset } from '../types/breathing';

export const DEFAULT_PRESETS: BreathingPreset[] = [
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    vietnameseTitle: 'Thở Vuông (Box 4-4-4-4)',
    description: 'Kỹ thuật đặc nhiệm Navy SEALs giúp lấy lại bình tĩnh, hạ cortisol và nâng cao độ tập trung cao độ.',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    defaultSessionDuration: 300, // 5 phút
    tag: 'Tập trung & Bình tĩnh',
    colorScheme: {
      primary: '#06b6d4', // Cyan
      glow: 'rgba(6, 182, 212, 0.45)',
      bgAccent: 'from-cyan-950/40 to-slate-900',
    },
  },
  {
    id: 'relax-478',
    name: '4-7-8 Relax',
    vietnameseTitle: 'Thư Giãn Sâu 4-7-8',
    description: 'Phương pháp nổi tiếng của TS. Andrew Weil. Giữ khí 7s làm chậm nhịp tim và thư giãn hệ thần kinh để ngủ sâu.',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    defaultSessionDuration: 300, // 5 phút
    tag: 'Dễ ngủ & Xả stress',
    colorScheme: {
      primary: '#8b5cf6', // Violet
      glow: 'rgba(139, 92, 246, 0.45)',
      bgAccent: 'from-purple-950/40 to-slate-900',
    },
  },
  {
    id: 'pranayama-equal',
    name: 'Equal Breathing',
    vietnameseTitle: 'Thở Cân Bằng (Sama Vritti)',
    description: 'Nhịp hít và thở đều 4s hoặc 5s không nín khí. Giúp ổn định huyết áp, giải tỏa mệt mỏi văn phòng.',
    inhale: 4,
    holdIn: 0,
    exhale: 4,
    holdOut: 0,
    defaultSessionDuration: 180, // 3 phút
    tag: 'Cân bằng & Tươi mới',
    colorScheme: {
      primary: '#10b981', // Emerald
      glow: 'rgba(16, 185, 129, 0.45)',
      bgAccent: 'from-emerald-950/40 to-slate-900',
    },
  },
  {
    id: 'calm-711',
    name: '7-11 De-stress',
    vietnameseTitle: 'Xả Căng Thẳng 7-11',
    description: 'Thở ra dài hơn hít vào kích thích tối đa dây thần kinh phế vị, lập tức hạ cơn lo âu, hồi hộp.',
    inhale: 7,
    holdIn: 0,
    exhale: 11,
    holdOut: 0,
    defaultSessionDuration: 300, // 5 phút
    tag: 'Giảm lo âu tức thì',
    colorScheme: {
      primary: '#3b82f6', // Blue
      glow: 'rgba(59, 130, 246, 0.45)',
      bgAccent: 'from-blue-950/40 to-slate-900',
    },
  },
  {
    id: 'awake-energy',
    name: 'Awake & Vitalize',
    vietnameseTitle: 'Đánh Thức Năng Lượng',
    description: 'Hít sâu 6s, giữ nhẹ 2s và thở dứt khoát 4s. Tăng lượng oxy nạp vào máu giúp cơ thể bừng tỉnh buổi sáng.',
    inhale: 6,
    holdIn: 2,
    exhale: 4,
    holdOut: 0,
    defaultSessionDuration: 180, // 3 phút
    tag: 'Tỉnh táo & Tràn năng lượng',
    colorScheme: {
      primary: '#f59e0b', // Amber
      glow: 'rgba(245, 158, 11, 0.45)',
      bgAccent: 'from-amber-950/40 to-slate-900',
    },
  },
  {
    id: 'custom-preset',
    name: 'Tùy Chỉnh Cá Nhân',
    vietnameseTitle: 'Chế Độ Tùy Chỉnh',
    description: 'Tự do thiết lập từng giây cho Hít vào, Giữ khí sau hít, Thở ra, và Giữ khí sau thở.',
    inhale: 5,
    holdIn: 3,
    exhale: 5,
    holdOut: 2,
    defaultSessionDuration: 300,
    tag: 'Tùy biến theo bạn',
    colorScheme: {
      primary: '#ec4899', // Pink
      glow: 'rgba(236, 72, 153, 0.45)',
      bgAccent: 'from-pink-950/40 to-slate-900',
    },
  },
];
