import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Store,
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Printer,
  ExternalLink,
  FileText,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Check,
  Send,
} from 'lucide-react';
import type { PathId } from '../types';
import { REG_PATHS } from '../data/paths';
import { REG_STEPS } from '../data/steps';

interface RegistrationChatAdvisorProps {
  onOpenAIChat?: (query: string) => void;
  onSelectDocId?: (docId: string) => void;
  onOpenConsultation?: () => void;
}

export type UserSelectionModel = 'household' | 'platform' | 'individual' | 'undecided';

export interface AdvisorAnswers {
  preferredModel?: UserSelectionModel;
  sector?: string;
  customSector?: string;
  channel?: 'ecommerce' | 'store' | 'social' | 'omnichannel';
  revenueBand?: 'under_1b' | '1b_to_3b' | 'over_3b';
  location?: 'hanoi' | 'hcm' | 'danang' | 'other';
  vneidStatus?: 'ready' | 'need_activation';
}

interface MessageItem {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  timestamp: string;
  widget?: 'comparison' | 'sector' | 'channel' | 'revenue' | 'location' | 'vneid' | 'roadmap';
}

export const RegistrationChatAdvisor: React.FC<RegistrationChatAdvisorProps> = ({
  onOpenAIChat,
  onSelectDocId,
  onOpenConsultation,
}) => {
  const [answers, setAnswers] = useState<AdvisorAnswers>({});
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [customSectorInput, setCustomSectorInput] = useState('');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Khởi tạo cuộc trò chuyện ban đầu
  useEffect(() => {
    startInitialChat();
  }, []);

  const startInitialChat = () => {
    setIsTyping(true);
    setAnswers({});
    setCheckedDocs({});
    setCustomSectorInput('');

    setTimeout(() => {
      setMessages([
        {
          id: 'msg-welcome-1',
          sender: 'bot',
          text: 'Xin chào bạn! Tôi là Trợ lý AI Tư vấn Đăng ký Kinh doanh & Thuế 2026.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: 'msg-welcome-2',
          sender: 'bot',
          text: 'Trước khi chuẩn bị giấy tờ, bước quan trọng nhất là xác định bạn nên đăng ký Hộ kinh doanh (HKD) hay Cá nhân kinh doanh (CNKD) để làm đúng thẩm quyền, tiết kiệm thời gian và hưởng trọn chính sách thuế mới.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: 'msg-comparison',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          widget: 'comparison',
        },
      ]);
      setIsTyping(false);
    }, 400);
  };

  const handleSelectModel = (model: UserSelectionModel, label: string) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAnswers((prev) => ({ ...prev, preferredModel: model }));

    setMessages((prev) => [
      ...prev,
      {
        id: `user-model-${Date.now()}`,
        sender: 'user',
        text: `Lựa chọn của tôi: ${label}`,
        timestamp: time,
      },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      let botResponse = '';
      if (model === 'household') {
        botResponse = 'Rất rõ ràng! Bạn dự kiến mở Hộ kinh doanh có địa điểm cố định. Bây giờ, tôi cần biết thêm về ngành nghề kinh doanh cụ thể để chuẩn bị mã ngành cấp 4 và hồ sơ đăng ký.';
      } else if (model === 'platform') {
        botResponse = 'Lựa chọn chuẩn xác! Với kênh bán hàng online / TMĐT, bạn không cần đăng ký giấy phép tại UBND mà chỉ cần thực hiện cấp phân loại 888 trên Cổng TMĐT thuế. Tiếp theo, ngành nghề sản phẩm bạn bán là gì?';
      } else if (model === 'individual') {
        botResponse = 'Đã ghi nhận! Mô hình Cá nhân kinh doanh tự do / lưu động sẽ đăng ký trực tiếp mã số thuế với Cơ quan Thuế. Hãy cho tôi biết ngành nghề cụ thể của bạn:';
      } else {
        botResponse = 'Không sao cả! Tôi sẽ hỏi bạn vài câu ngắn gọn về ngành nghề, kênh bán và quy mô để phân tích mô hình tối ưu nhất cho bạn.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-sector-prompt-${Date.now()}`,
          sender: 'bot',
          text: botResponse,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `bot-sector-widget-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          widget: 'sector',
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleSelectSector = (sectorVal: string, label: string) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAnswers((prev) => ({ ...prev, sector: sectorVal, customSector: sectorVal === 'custom' ? customSectorInput : undefined }));

    setMessages((prev) => [
      ...prev,
      {
        id: `user-sector-${Date.now()}`,
        sender: 'user',
        text: `Ngành nghề: ${label}`,
        timestamp: time,
      },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-channel-prompt-${Date.now()}`,
          sender: 'bot',
          text: 'Tiếp theo, bạn dự kiến tiếp cận khách hàng và bán hàng qua những kênh nào là chủ yếu?',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `bot-channel-widget-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          widget: 'channel',
        },
      ]);
      setIsTyping(false);
    }, 500);
  };

  const handleSelectChannel = (channel: 'ecommerce' | 'store' | 'social' | 'omnichannel', label: string) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAnswers((prev) => ({ ...prev, channel }));

    setMessages((prev) => [
      ...prev,
      {
        id: `user-channel-${Date.now()}`,
        sender: 'user',
        text: `Kênh bán hàng: ${label}`,
        timestamp: time,
      },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-revenue-prompt-${Date.now()}`,
          sender: 'bot',
          text: 'Về quy mô: Năm 2026, Nghị định 141/2026/NĐ-CP nâng ngưỡng miễn toàn bộ thuế GTGT & TNCN lên 1 tỷ đồng/năm. Dự kiến mức doanh thu 1 năm của bạn khoảng bao nhiêu?',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `bot-revenue-widget-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          widget: 'revenue',
        },
      ]);
      setIsTyping(false);
    }, 500);
  };

  const handleSelectRevenue = (revenueBand: 'under_1b' | '1b_to_3b' | 'over_3b', label: string) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAnswers((prev) => ({ ...prev, revenueBand }));

    setMessages((prev) => [
      ...prev,
      {
        id: `user-revenue-${Date.now()}`,
        sender: 'user',
        text: `Dự kiến doanh thu: ${label}`,
        timestamp: time,
      },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-location-prompt-${Date.now()}`,
          sender: 'bot',
          text: 'Bạn dự kiến đăng ký hoạt động kinh doanh tại tỉnh / thành phố nào?',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `bot-location-widget-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          widget: 'location',
        },
      ]);
      setIsTyping(false);
    }, 500);
  };

  const handleSelectLocation = (location: 'hanoi' | 'hcm' | 'danang' | 'other', label: string) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAnswers((prev) => ({ ...prev, location }));

    setMessages((prev) => [
      ...prev,
      {
        id: `user-loc-${Date.now()}`,
        sender: 'user',
        text: `Địa bàn: ${label}`,
        timestamp: time,
      },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-vneid-prompt-${Date.now()}`,
          sender: 'bot',
          text: 'Câu hỏi cuối cùng: Bạn đã có Căn cước công dân gắn chip (CCCD 12 số) và tài khoản VNeID Mức 2 chưa? (Từ 01/07/2025 theo Thông tư 86/2024/TT-BTC, CCCD tích hợp thay thế MST cá nhân).',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `bot-vneid-widget-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          widget: 'vneid',
        },
      ]);
      setIsTyping(false);
    }, 500);
  };

  const handleSelectVneid = (vneidStatus: 'ready' | 'need_activation', label: string) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAnswers((prev) => ({ ...prev, vneidStatus }));

    setMessages((prev) => [
      ...prev,
      {
        id: `user-vneid-${Date.now()}`,
        sender: 'user',
        text: `Tình trạng giấy tờ: ${label}`,
        timestamp: time,
      },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-done-prompt-${Date.now()}`,
          sender: 'bot',
          text: 'Tuyệt vời! Tôi đã tổng hợp đầy đủ dữ kiện về trường hợp của bạn. Dưới đây là phân tích mô hình tối ưu, checklist hồ sơ và hướng dẫn Step-by-Step đăng ký chi tiết:',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `bot-roadmap-widget-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          widget: 'roadmap',
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  // Tính toán mô hình khuyến nghị cuối cùng
  const getRecommendation = () => {
    if (answers.preferredModel === 'household') {
      return {
        pathId: 'household' as PathId,
        title: 'Hộ kinh doanh cá thể tại UBND Quận/Huyện',
        code: 'HKD-UBND',
        portalName: 'Cổng Dịch vụ công Quốc gia hoặc Bộ phận Một cửa UBND cấp Huyện',
        portalUrl: 'https://dichvucong.gov.vn',
        reason: 'Bạn có nhu cầu mở cửa hàng/cơ sở vật lý, treo biển hiệu và ký hợp đồng giao dịch có tư cách Hộ kinh doanh.',
        fee: 'Khoảng 100.000đ (miễn/giảm khi nộp online)',
        duration: '03 ngày làm việc (liên thông sang cơ quan thuế cấp MST)',
      };
    }

    if (answers.channel === 'ecommerce' || answers.sector === 'affiliate' || answers.preferredModel === 'platform') {
      return {
        pathId: 'platform' as PathId,
        title: 'Cá nhân kinh doanh TMĐT & Tiếp thị liên kết (Mã 888)',
        code: 'TMDT-888',
        portalName: 'Cổng thông tin TMĐT dành cho cá nhân (Tổng cục Thuế)',
        portalUrl: 'https://canhantmdt.gdt.gov.vn',
        reason: 'Bạn kinh doanh thuần online trên sàn TMĐT/mạng xã hội; thuộc diện sàn khấu trừ nộp thay thuế và gắn phân loại 888 theo Công văn 311/TCT-DNNCN.',
        fee: '0 VNĐ (Miễn hoàn toàn lệ phí)',
        duration: '15 phút thao tác trực tuyến qua VNeID Mức 2',
      };
    }

    if (answers.channel === 'store' || answers.channel === 'omnichannel' || answers.sector === 'food') {
      return {
        pathId: 'household' as PathId,
        title: 'Hộ kinh doanh cá thể tại UBND Quận/Huyện',
        code: 'HKD-UBND',
        portalName: 'Cổng Dịch vụ công Quốc gia / Một cửa UBND Quận Huyện',
        portalUrl: 'https://dichvucong.gov.vn',
        reason: 'Ngành F&B hoặc có điểm đón khách trực tiếp bắt buộc phải đăng ký Hộ kinh doanh để đủ điều kiện cấp phép VSATTP và PCCC.',
        fee: 'Khoảng 100.000đ',
        duration: '03 ngày làm việc',
      };
    }

    return {
      pathId: 'individual' as PathId,
      title: 'Cá nhân kinh doanh trực tiếp với Cơ quan Thuế',
      code: 'CNKD-TRUCTIEP',
      portalName: 'Cổng Dịch vụ công Quốc gia (DVC) hoặc eTax Mobile',
      portalUrl: 'https://dichvucong.gov.vn',
      reason: 'Bạn kinh doanh tự do, dịch vụ lưu động không có địa điểm cố định; được miễn đăng ký HKD tại UBND nhưng đăng ký thuế trực tiếp.',
      fee: '0 VNĐ (Miễn lệ phí)',
      duration: '03 ngày làm việc',
    };
  };

  const rec = getRecommendation();
  const currentPathData = REG_PATHS[rec.pathId] || REG_PATHS.household;
  const pathSteps = currentPathData.stepIds.map((id) => REG_STEPS[id]).filter(Boolean);

  const toggleDoc = (docId: string) => {
    setCheckedDocs((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden max-w-4xl mx-auto">
      {/* 1. Header Chatbot Tư Vấn */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">Trợ lý Tư vấn Đăng ký Kinh doanh</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Luật 2026
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <span>Hỏi đáp thông minh</span>
              <span>·</span>
              <span className="text-emerald-300 font-medium">Phân định HKD vs Cá nhân kinh doanh</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={startInitialChat}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
            title="Làm lại cuộc trò chuyện từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tư vấn lại</span>
          </button>
        </div>
      </div>

      {/* 2. Chat Stream Canvas */}
      <div className="p-4 sm:p-6 space-y-6 max-h-[750px] overflow-y-auto bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-4">
            {/* Tin nhắn văn bản thông thường */}
            {msg.text && (
              <div className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <Bot className="w-4 h-4 text-emerald-700" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1.5 font-sans ${
                      msg.sender === 'user' ? 'text-emerald-100 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            )}

            {/* WIDGET 1: BẢNG SO SÁNH KHI NÀO ĐĂNG KÝ HKD VS CÁ NHÂN KINH DOANH */}
            {msg.widget === 'comparison' && !answers.preferredModel && (
              <div className="bg-white rounded-2xl border border-emerald-200/90 p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                    Bước 1 · Phân biệt cốt lõi
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-slate-900">
                    Khi nào cần đăng ký Hộ kinh doanh vs Cá nhân kinh doanh?
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Hãy xem các điểm khác nhau bên dưới và tích chọn mô hình phù hợp với dự định của bạn:
                  </p>
                </div>

                {/* Bảng so sánh trực quan 2 cột */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cột A: Hộ kinh doanh */}
                  <div className="rounded-xl border-2 border-emerald-500/80 bg-emerald-50/40 p-4 flex flex-col justify-between space-y-3 relative hover:shadow-md transition-all">
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      Phổ biến
                    </span>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                        <Store className="w-5 h-5 text-emerald-700 shrink-0" />
                        <span>HỘ KINH DOANH (HKD)</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Dành cho cơ sở có địa điểm cố định, treo biển hiệu hoặc cần xuất hóa đơn chính danh HKD.
                      </p>

                      <ul className="text-xs space-y-1.5 text-slate-700 pt-1 border-t border-emerald-200/60">
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Khi nào cần:</strong> Mở cửa hàng, quán ăn, kho hàng, xưởng, tiệm làm đẹp đón khách.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Cơ quan cấp:</strong> UBND Quận/Huyện cấp Giấy chứng nhận ĐKHKD + Thuế cấp MST 10 số.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Lệ phí & Thời gian:</strong> ~100.000đ (miễn/giảm online) · 03 ngày làm việc liên thông.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Hóa đơn:</strong> Được phát hành HĐĐT có mã hoặc khởi tạo từ máy tính tiền.</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectModel('household', 'Hộ kinh doanh cá thể (Có mặt bằng, cửa hàng)')}
                      className="w-full mt-2 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <span>Tôi chọn Hộ kinh doanh</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cột B: Cá nhân kinh doanh / TMĐT */}
                  <div className="rounded-xl border-2 border-teal-500/80 bg-teal-50/40 p-4 flex flex-col justify-between space-y-3 relative hover:shadow-md transition-all">
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase bg-teal-600 text-white px-2 py-0.5 rounded-full">
                      Online / Tự do
                    </span>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                        <ShoppingBag className="w-5 h-5 text-teal-700 shrink-0" />
                        <span>CÁ NHÂN KINH DOANH / TMĐT</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Dành cho người bán hàng online Shopee, TikTok Shop, Affiliate, Freelancer, lưu động.
                      </p>

                      <ul className="text-xs space-y-1.5 text-slate-700 pt-1 border-t border-teal-200/60">
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span><strong>Khi nào cần:</strong> Bán hàng thuần online, không có cửa hàng đón khách, buôn chuyến.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span><strong>Cơ quan cấp:</strong> Trực tiếp Cơ quan Thuế hoặc Cổng TMĐT (Mã 888) · <strong>KHÔNG qua UBND</strong>.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span><strong>Lệ phí & Thời gian:</strong> <strong>0 VNĐ</strong> (miễn hoàn toàn) · Thao tác online 15 phút.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span><strong>Định danh:</strong> Dùng số CCCD 12 số và tài khoản VNeID Mức 2 (TT 86/2024/TT-BTC).</span>
                        </li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => handleSelectModel('platform', 'Cá nhân kinh doanh trên sàn TMĐT & MXH (Mã 888)')}
                        className="py-2.5 px-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer text-center"
                      >
                        <span>Bán sàn TMĐT (888)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectModel('individual', 'Cá nhân kinh doanh trực tiếp với Cơ quan Thuế')}
                        className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer text-center"
                      >
                        <span>Tự do / Lưu động</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nút hỗ trợ nếu chưa biết */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleSelectModel('undecided', 'Tôi chưa rõ, hãy hỏi thêm để tư vấn giúp tôi')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Tôi chưa rõ mình thuộc trường hợp nào, hãy hỏi thêm để phân tích giúp tôi</span>
                  </button>
                </div>
              </div>
            )}

            {/* WIDGET 2: CHỌN NGÀNH NGHỀ KINH DOANH */}
            {msg.widget === 'sector' && !answers.sector && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 animate-in fade-in duration-300">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Bước 2 · Ngành nghề hoạt động
                </span>
                <p className="text-xs text-slate-600">Chọn ngành nghề chính bạn dự kiến kinh doanh:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'retail', label: 'Bán lẻ hàng hóa (Thời trang, mỹ phẩm, tạp hóa, phụ kiện)' },
                    { id: 'food', label: 'Quán ăn, đồ uống, nhà hàng, F&B' },
                    { id: 'ecommerce', label: 'Bán hàng trên sàn TMĐT (TikTok Shop, Shopee, Lazada)' },
                    { id: 'affiliate', label: 'Tiếp thị liên kết (Affiliate marketing KOC/KOL)' },
                    { id: 'freelance', label: 'Dịch vụ tự do (IT, lập trình, thiết kế, marketing, tư vấn)' },
                    { id: 'rental', label: 'Cho thuê nhà, phòng trọ, mặt bằng, căn hộ' },
                    { id: 'service', label: 'Dịch vụ sửa chữa, gia công, cắt tóc, giặt là' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSector(item.id, item.label)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left text-xs font-semibold text-slate-800 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>

                {/* Ô nhập ngành nghề tự do */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={customSectorInput}
                    onChange={(e) => setCustomSectorInput(e.target.value)}
                    placeholder="Hoặc gõ ngành nghề khác của bạn..."
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={!customSectorInput.trim()}
                    onClick={() => handleSelectSector('custom', customSectorInput.trim())}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Chọn</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* WIDGET 3: CHỌN KÊNH BÁN HÀNG */}
            {msg.widget === 'channel' && !answers.channel && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 animate-in fade-in duration-300">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Bước 3 · Kênh bán & Tiếp cận khách
                </span>
                <p className="text-xs text-slate-600">Bạn sẽ phân phối và nhận tiền bán hàng qua đâu?</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'ecommerce',
                      label: 'Bán trên sàn TMĐT (Shopee, TikTok Shop, Lazada)',
                      desc: 'Sàn khấu trừ và nộp thay thuế GTGT 1% và TNCN 0.5%',
                    },
                    {
                      id: 'store',
                      label: 'Mở cửa hàng trực tiếp đón khách',
                      desc: 'Nhận thanh toán tiền mặt, chuyển khoản QR tại điểm bán',
                    },
                    {
                      id: 'social',
                      label: 'Mạng xã hội (Facebook, Zalo, Livestream)',
                      desc: 'Tự chốt đơn và gửi hàng qua các đơn vị chuyển phát COD',
                    },
                    {
                      id: 'omnichannel',
                      label: 'Mô hình đa kênh (Cả cửa hàng vật lý và online)',
                      desc: 'Vừa có điểm bán vừa đẩy mạnh gian hàng online',
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectChannel(item.id as any, item.label)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 group"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* WIDGET 4: DOANH THU DỰ KIẾN */}
            {msg.widget === 'revenue' && !answers.revenueBand && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 animate-in fade-in duration-300">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Bước 4 · Quy mô doanh thu 2026
                </span>
                <p className="text-xs text-slate-600">Chọn mức doanh thu dự kiến trong một năm dương lịch:</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectRevenue('under_1b', 'Dưới 1 tỷ đồng / năm (Dưới ~83 triệu/tháng)')}
                    className="p-3.5 rounded-xl border-2 border-emerald-500/70 bg-emerald-50/40 hover:bg-emerald-50 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5"
                  >
                    <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full w-max">
                      MIỄN 100% THUẾ
                    </span>
                    <div className="text-xs font-bold text-emerald-950">Dưới 1 tỷ đồng/năm</div>
                    <div className="text-[11px] text-slate-600">
                      Miễn toàn bộ thuế GTGT & TNCN theo NĐ 141/2026; không bắt buộc HĐĐT.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRevenue('1b_to_3b', 'Từ 1 tỷ đến 3 tỷ đồng / năm')}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-slate-50 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full w-max">
                      NỘP THUẾ & HĐĐT
                    </span>
                    <div className="text-xs font-bold text-slate-900">Từ 1 tỷ đến 3 tỷ đồng/năm</div>
                    <div className="text-[11px] text-slate-600">
                      Khai nộp thuế theo biểu tỷ lệ; bắt buộc đăng ký HĐĐT trong 30 ngày.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRevenue('over_3b', 'Trên 3 tỷ đồng / năm')}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-slate-50 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5"
                  >
                    <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full w-max">
                      QUY MÔ LỚN
                    </span>
                    <div className="text-xs font-bold text-slate-900">Trên 3 tỷ đồng/năm</div>
                    <div className="text-[11px] text-slate-600">
                      Bắt buộc tính thuế TNCN theo thu nhập chịu thuế (17%) hoặc chuyển đổi lên doanh nghiệp.
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* WIDGET 5: ĐỊA BÀN ĐĂNG KÝ */}
            {msg.widget === 'location' && !answers.location && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 animate-in fade-in duration-300">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Bước 5 · Địa bàn kinh doanh
                </span>
                <p className="text-xs text-slate-600">Chọn tỉnh / thành phố bạn dự kiến đăng ký:</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'hanoi', label: 'Hà Nội' },
                    { id: 'hcm', label: 'TP. Hồ Chí Minh' },
                    { id: 'danang', label: 'Đà Nẵng' },
                    { id: 'other', label: 'Tỉnh / Thành khác' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectLocation(item.id as any, item.label)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-center text-xs font-bold text-slate-800 transition-all cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* WIDGET 6: TÌNH TRẠNG GIẤY TỜ ĐỊNH DANH */}
            {msg.widget === 'vneid' && !answers.vneidStatus && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 animate-in fade-in duration-300">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Bước 6 · Chuẩn bị định danh cá nhân
                </span>
                <p className="text-xs text-slate-600">Tình trạng giấy tờ và tài khoản VNeID của bạn:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectVneid('ready', 'Đã có CCCD 12 số và tài khoản VNeID Mức 2')}
                    className="p-3.5 rounded-xl border-2 border-emerald-500/70 bg-emerald-50/40 hover:bg-emerald-50 text-left transition-all cursor-pointer flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Đã kích hoạt VNeID Mức 2</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Đủ điều kiện nộp hồ sơ online 100% qua Cổng Dịch vụ công Quốc gia hoặc Cổng TMĐT.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectVneid('need_activation', 'Chỉ có CCCD, chưa kích hoạt VNeID Mức 2')}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-slate-50 text-left transition-all cursor-pointer flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Chưa có VNeID Mức 2</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Cần mang CCCD ra Công an xã/phường để kích hoạt Mức 2 trước khi nộp hồ sơ online.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* WIDGET 7: HƯỚNG DẪN STEP-BY-STEP HOÀN CHỈNH MAY ĐO RIÊNG */}
            {msg.widget === 'roadmap' && (
              <div className="space-y-6 animate-in fade-in duration-500 pt-2">
                {/* 1. THẺ KẾT LUẬN MÔ HÌNH KHUYẾN NGHỊ */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-6 shadow-lg border border-emerald-700/40 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <span className="text-[11px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                      MÔ HÌNH PHÙ HỢP NHẤT
                    </span>
                    <span className="text-xs text-emerald-200 font-mono">Mã: {rec.code}</span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{rec.title}</h3>
                    <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                      {rec.reason}
                    </p>
                  </div>

                  {/* Chỉ số nhanh */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                    <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                      <span className="text-slate-300 block text-[10px]">Cơ quan tiếp nhận:</span>
                      <strong className="text-white font-semibold truncate block mt-0.5">{rec.portalName}</strong>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                      <span className="text-slate-300 block text-[10px]">Thời gian xử lý:</span>
                      <strong className="text-emerald-300 font-semibold block mt-0.5">{rec.duration}</strong>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 col-span-2 sm:col-span-1">
                      <span className="text-slate-300 block text-[10px]">Lệ phí nhà nước:</span>
                      <strong className="text-white font-semibold block mt-0.5">{rec.fee}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. CHECKLIST HỒ SƠ CẦN CHUẨN BỊ (Có thể tick) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-black text-slate-900 text-sm">Danh mục giấy tờ cần chuẩn bị trước</h4>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Tích chọn khi bạn đã có sẵn
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {rec.pathId === 'household' ? (
                      <>
                        {[
                          { id: 'hkd-doc-1', label: 'Giấy đề nghị đăng ký hộ kinh doanh (Mẫu phụ lục III-1 theo Thông tư 02/2023/TT-BKHĐT)' },
                          { id: 'hkd-doc-2', label: 'Bản sao Căn cước công dân gắn chip của chủ hộ và các thành viên hộ gia đình (nếu cùng góp vốn)' },
                          { id: 'hkd-doc-3', label: 'Hợp đồng thuê địa điểm kinh doanh hoặc Giấy chứng nhận quyền sử dụng đất (bản photo/scan)' },
                          { id: 'hkd-doc-4', label: 'Văn bản ủy quyền (nếu nhờ người khác đi nộp thay tại Bộ phận một cửa)' },
                        ].map((doc) => (
                          <label
                            key={doc.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              checkedDocs[doc.id]
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                                : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!checkedDocs[doc.id]}
                              onChange={() => toggleDoc(doc.id)}
                              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>{doc.label}</span>
                          </label>
                        ))}
                      </>
                    ) : rec.pathId === 'platform' ? (
                      <>
                        {[
                          { id: 'tmdt-doc-1', label: 'Số Căn cước công dân gắn chip 12 số (đã tích hợp làm mã số thuế)' },
                          { id: 'tmdt-doc-2', label: 'Tài khoản Định danh điện tử VNeID Mức 2 đang hoạt động trên điện thoại' },
                          { id: 'tmdt-doc-3', label: 'Số tài khoản ngân hàng chính chủ mang tên bạn để liên kết gian hàng TMĐT' },
                          { id: 'tmdt-doc-4', label: 'Thông tin gian hàng trên Shopee/TikTok Shop (tên shop, link shop để khai báo mã 888)' },
                        ].map((doc) => (
                          <label
                            key={doc.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              checkedDocs[doc.id]
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                                : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!checkedDocs[doc.id]}
                              onChange={() => toggleDoc(doc.id)}
                              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>{doc.label}</span>
                          </label>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          { id: 'ind-doc-1', label: 'Tờ khai đăng ký thuế cá nhân kinh doanh (Mẫu 01/ĐK-TCT theo Thông tư 105/2020/TT-BTC)' },
                          { id: 'ind-doc-2', label: 'Bản sao CCCD gắn chip 12 số (hoặc tài khoản VNeID Mức 2 để nộp online)' },
                          { id: 'ind-doc-3', label: 'Số tài khoản ngân hàng chính chủ để đăng ký nộp thuế điện tử eTax' },
                        ].map((doc) => (
                          <label
                            key={doc.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              checkedDocs[doc.id]
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                                : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!checkedDocs[doc.id]}
                              onChange={() => toggleDoc(doc.id)}
                              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>{doc.label}</span>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* 3. LỘ TRÌNH THỰC HIỆN STEP-BY-STEP */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Hướng dẫn Step-by-Step quy trình đăng ký</span>
                    </h4>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {pathSteps.length} bước chuẩn hóa
                    </span>
                  </div>

                  <div className="space-y-4">
                    {pathSteps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="p-4 rounded-xl border border-slate-200/90 hover:border-emerald-300 bg-slate-50/30 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">{step.title}</h5>
                          </div>

                          {step.where && (
                            <a
                              href={step.where.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg shrink-0 shadow-2xs"
                            >
                              <span>{step.where.label}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-medium pl-8.5">
                          {step.summary}
                        </p>

                        {/* Danh sách hành động cụ thể */}
                        <div className="pl-8.5 space-y-1.5 pt-1">
                          {step.actions.map((act, actIdx) => (
                            <div key={actIdx} className="flex items-start gap-2 text-xs text-slate-700">
                              <span className="text-emerald-600 font-bold">·</span>
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>

                        {/* Warnings / Lưu ý nếu có */}
                        {step.warnings && step.warnings.length > 0 && (
                          <div className="ml-8.5 mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>{step.warnings[0]}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. THANH HÀNH ĐỘNG CUỐI CÙNG */}
                <div className="bg-slate-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Căn cứ Nghị định 168/2025/NĐ-CP & Nghị định 141/2026/NĐ-CP</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>In lộ trình</span>
                    </button>

                    {onSelectDocId && (
                      <button
                        type="button"
                        onClick={() =>
                          onSelectDocId(
                            rec.pathId === 'household'
                              ? 'ND-168-2025-ND-CP'
                              : 'ND-141-2026-ND-CP'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Xem luật gốc</span>
                      </button>
                    )}

                    {onOpenConsultation && (
                      <button
                        type="button"
                        onClick={onOpenConsultation}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition-all cursor-pointer"
                      >
                        <span>Đặt lịch tư vấn 1-1</span>
                      </button>
                    )}

                    {onOpenAIChat && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenAIChat(
                            `Tư vấn thêm về trường hợp của tôi: Tôi muốn đăng ký ${rec.title}, ngành nghề ${
                              answers.customSector || answers.sector || 'kinh doanh'
                            }, doanh thu dự kiến ${answers.revenueBand || 'dưới 1 tỷ'}. Cần lưu ý gì khi làm thủ tục?`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Hỏi AI về hồ sơ của tôi</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={startInitialChat}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Tư vấn ca khác</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Hiệu ứng Bot đang gõ chữ */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pl-1">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[11px] font-medium text-slate-500 ml-1.5">Trợ lý đang phân tích hồ sơ...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default RegistrationChatAdvisor;
