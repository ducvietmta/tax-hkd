/**
 * UNDERSTAND QUERY - BỘ PHÂN LOẠI QUYẾT ĐỊNH L1 (DETERMINISTIC)
 *
 * Thực hiện trích xuất dữ kiện và phân loại nhãn ngữ nghĩa (S-Labels)
 * hoàn toàn bằng CPU thuần túy (0ms mạng, 0đ chi phí API) cho >80% trường hợp.
 */

import type { AnswerScope } from '../answerScope';
import type {
  TaxDecisionFrame,
  MissingFact,
  Provenance,
} from './types';
import type { TaxpayerType, Residency, IncomeType, TaxIntent, TaxCategory, ConversationAct, JurisdictionType } from './labels';
import { extractTaxFacts, extractResidency, fold } from './factExtractor';

export function understandQuery(
  query: string,
  scope: AnswerScope,
  history?: Array<{ role: string; content: string }>
): TaxDecisionFrame {
  const startTime = Date.now();
  const q = fold(query);
  const positiveActivityText = q.replace(/\b(?:khong|chua|chang)\s+(?:ban\s+le|ban\s+hang|kinh\s+doanh)\b(?:\s+(?:tap\s+hoa|hang\s+hoa))?/g, ' ');

  // 1. Phân tích tax_period (Kế thừa từ AnswerScope đã có)
  const isHistorical = scope.years.some((y) => y < 2026);
  const isFutureUnsupported = scope.years.some((y) => y > 2027);
  const taxPeriod = {
    years: scope.years,
    source: scope.periodSource,
    granularity: 'YEAR' as const,
    is_historical: isHistorical,
    is_future_unsupported: isFutureUnsupported,
  };

  // 2. Phân loại taxpayer_type (Lớp S)
  let taxpayerType: TaxpayerType = 'UNKNOWN';
  let taxpayerConfidence = 0.5;
  let taxpayerSource: Provenance<TaxpayerType>['source'] = 'default';
  let taxpayerSpan: string | undefined;

  if (/\b(ho kinh doanh|hkd|tiem|quan an|quan pho|cua hang|tap hoa)\b/.test(positiveActivityText)) {
    taxpayerType = 'HOUSEHOLD_BUSINESS';
    taxpayerConfidence = 0.9;
    taxpayerSource = 'user_text';
    taxpayerSpan = 'ho kinh doanh / cua hang';
  } else if (/\b(ca nhan kinh doanh|cnkd|freelancer|ban hang online|chay xe|tai xe)\b/.test(q)) {
    taxpayerType = 'INDIVIDUAL_BUSINESS';
    taxpayerConfidence = 0.85;
    taxpayerSource = 'user_text';
    taxpayerSpan = 'ca nhan kinh doanh / ban online';
  } else if (/\b(luong|tien cong|nhan vien|hop dong lao dong)\b/.test(q) && !/\b(kinh doanh|ban hang)\b/.test(q)) {
    taxpayerType = 'INDIVIDUAL_EMPLOYEE';
    taxpayerConfidence = 0.85;
    taxpayerSource = 'user_text';
  } else if (/\b(doanh nghiep|cong ty|tnhh|co phan)\b/.test(q)) {
    taxpayerType = 'ENTERPRISE';
    taxpayerConfidence = 0.9;
    taxpayerSource = 'user_text';
  } else if (/\b(chu san|shopee khau tru|tiktok khau tru|nen tang nop thay)\b/.test(q)) {
    taxpayerType = 'PLATFORM_OPERATOR';
    taxpayerConfidence = 0.8;
    taxpayerSource = 'inferred';
  } else {
    // Mặc định cho người nộp thuế thông thường
    taxpayerType = 'INDIVIDUAL_BUSINESS';
    taxpayerConfidence = 0.6;
    taxpayerSource = 'default';
  }

  // 3. Tình trạng cư trú
  const { residency: resVal, isResident } = extractResidency(query);
  const residency: Provenance<Residency> = {
    value: resVal,
    confidence: resVal === 'UNKNOWN' ? 0.7 : 0.95,
    source: resVal === 'UNKNOWN' ? 'default' : 'user_text',
  };

  // 4. Conversation Act (Hành động đàm thoại)
  let act: ConversationAct = 'NEW_QUESTION';
  if (history && history.length > 0) {
    if (/\b(con neu|neu la|vay con|the con|neu|truong hop)\b/.test(q) && /\d+/.test(q)) {
      act = 'FOLLOW_UP_FACT';
    } else if (/\b(a nham|y minh la|y toi la|khong phai|dinh chinh)\b/.test(q)) {
      act = 'CORRECTION';
    } else if (q.length < 30 && /\d+/.test(q)) {
      act = 'FOLLOW_UP_FACT';
    }
  }

  // 5. Địa phương (Jurisdiction)
  let jurisdictionVal: JurisdictionType = 'NATIONAL';
  let province: string | undefined;
  const provinceMatch = q.match(/\b(ha noi|tp\.?hcm|ho chi minh|da nang|hai phong|can tho|binh duong|dong nai)\b/);
  if (provinceMatch) {
    jurisdictionVal = 'LOCAL';
    province = provinceMatch[1];
  }

  // 6. Phân loại loại thu nhập (Income Types)
  const incomeTypes: Array<Provenance<IncomeType>> = [];

  if (/\b(ban hang|ban le|hang hoa|tap hoa|phan phoi|thuong mai)\b/.test(positiveActivityText)) {
    incomeTypes.push({ value: 'GOODS_SALES', confidence: 0.95, source: 'user_text' });
  }
  if (/\b(quan pho|quan an|an uong|nha hang|ca phe|tra sua)\b/.test(q)) {
    incomeTypes.push({ value: 'FOOD_SERVICE', confidence: 0.95, source: 'user_text' });
  }
  if (/\b(shopee|lazada|tiki|tiktok shop|san tmdt)\b/.test(q)) {
    incomeTypes.push({ value: 'MARKETPLACE_SALES', confidence: 0.95, source: 'user_text' });
  }
  if (/\b(affiliate|tiep thi lien ket|hoa hong|koc|kol)\b/.test(q)) {
    incomeTypes.push({ value: 'AFFILIATE_COMMISSION', confidence: 0.95, source: 'user_text' });
  }
  if (/\b(cho thue|thue nha|thue xe|thue mat bang|tai san)\b/.test(q)) {
    incomeTypes.push({ value: 'PROPERTY_RENTAL', confidence: 0.95, source: 'user_text' });
  }
  if (/\b(freelancer|lap trinh|thiet ke|tu van doc lap)\b/.test(q)) {
    incomeTypes.push({ value: 'FREELANCE_SERVICE', confidence: 0.9, source: 'user_text' });
  }
  if (/\b(quang cao|youtube|adsense|facebook view|noi dung so)\b/.test(q)) {
    incomeTypes.push({ value: 'CONTENT_ADS', confidence: 0.9, source: 'user_text' });
  }
  if (/\b(dich vu|sua chua|sua may|sua xe|gia cong|van chuyen)\b/.test(q) && !incomeTypes.some(t => t.value === 'SERVICE')) {
    incomeTypes.push({ value: 'SERVICE', confidence: 0.9, source: 'user_text' });
  }
  if (incomeTypes.length === 0) {
    incomeTypes.push({ value: 'UNKNOWN', confidence: 0.5, source: 'default' });
  }

  // 7. Mục đích câu hỏi thuế (Tax Intent)
  let primaryIntent: TaxIntent = 'TAX_CALCULATION';
  const secondaryIntents: TaxIntent[] = [];

  if (/\b(ma 888|mst 888|dinh danh|14 so|ma so thue 888)\b/.test(q)) {
    primaryIntent = 'TAX_ID_888';
    if (/\b(dang ky|thu tuc)\b/.test(q)) secondaryIntents.push('REGISTRATION');
  } else if (/\b(so sanh|khac gi|2025 va 2026|2025 vs 2026)\b/.test(q)) {
    primaryIntent = 'COMPARE_PERIODS';
  } else if (/\b(hoa don|hddt|may tinh tien|30 ngay)\b/.test(q)) {
    if (/\b(tinh thue|bao nhieu|phai nop)\b/.test(q)) {
      primaryIntent = 'TAX_CALCULATION';
      secondaryIntents.push('E_INVOICE');
    } else {
      primaryIntent = 'E_INVOICE';
    }
  } else if (/\b(giam thue|giam gtgt|nghi quyet 43|nq 43|giam 30|giam 20|nghi quyet 204|nq 204|174\/2025)\b/.test(q)) {
    if (/\b(tinh thue|bao nhieu|phai nop)\b/.test(q)) {
      primaryIntent = 'TAX_CALCULATION';
      secondaryIntents.push('RELIEF_REDUCTION');
    } else {
      primaryIntent = 'RELIEF_REDUCTION';
    }
  } else if (/\b(dang ky|thanh lap|mo ho|thu tuc dang ky|dich vu cong)\b/.test(q)) {
    primaryIntent = 'REGISTRATION';
  } else if (/\b(ke khai|to khai|nop to khai|thang hay quy|han nop)\b/.test(q)) {
    primaryIntent = 'DECLARATION_FILING';
  } else if (/\b(phat|cham nop|xu phat|truy thu)\b/.test(q)) {
    primaryIntent = 'PENALTY';
  } else if (/\b(mon bai|le phi mon bai)\b/.test(q)) {
    primaryIntent = 'LICENSE_FEE';
  } else if (/\b(so sach|chung tu|ke toan)\b/.test(q)) {
    primaryIntent = 'ACCOUNTING_BOOKS';
  } else if (/\b(mien thue|nguong|duoi 1 ty|duoi 100|duoi 500|co phai nop)\b/.test(q)) {
    primaryIntent = 'EXEMPTION_ELIGIBILITY';
  }

  if (/\b(khau tru|nop thay|giu lai)\b/.test(q) && !secondaryIntents.includes('PLATFORM_WITHHOLDING')) {
    secondaryIntents.push('PLATFORM_WITHHOLDING');
  }

  // 8. Thuế suất / Danh mục thuế (Tax Categories)
  const taxCategories: TaxCategory[] = [];
  if (primaryIntent === 'LICENSE_FEE') {
    taxCategories.push('LICENSE_FEE');
  } else if (primaryIntent === 'PENALTY') {
    taxCategories.push('ADMIN_PENALTY');
  } else {
    taxCategories.push('VAT', 'PIT');
  }

  // 9. Trích xuất dữ kiện số (Facts)
  const facts = extractTaxFacts(query, scope.years[0] || 2026);

  // 10. Missing facts & Cảnh báo dữ kiện thiếu
  const missingFacts: MissingFact[] = [];
  if (incomeTypes.some(t => t.value === 'AFFILIATE_COMMISSION') && primaryIntent === 'TAX_CALCULATION') {
    missingFacts.push({
      id: 'affiliate_nature',
      blocking: true,
      ask: 'Khoản hoa hồng này bạn nhận theo hợp đồng dịch vụ quảng cáo/đại lý, hay khấu trừ như tiền công tiền lương?',
    });
  }
  if (facts.revenue_basis === 'MONTHLY' && facts.revenue_vnd && facts.revenue_vnd < 100_000_000 && primaryIntent === 'TAX_CALCULATION') {
    missingFacts.push({
      id: 'annual_revenue_projection',
      blocking: false,
      ask: 'Tổng doanh thu dự kiến cả năm của bạn là bao nhiêu để xác định chính xác ngưỡng miễn thuế?',
    });
  }

  const confidence = taxpayerConfidence * (incomeTypes[0].confidence || 0.8);
  const latencyMs = Date.now() - startTime;

  return {
    schema_version: '1.0',
    tax_period: taxPeriod,
    taxpayer_type: {
      value: taxpayerType,
      confidence: taxpayerConfidence,
      source: taxpayerSource,
      span: taxpayerSpan,
    },
    residency,
    conversation_act: {
      value: act,
      confidence: 0.9,
      source: 'inferred',
    },
    jurisdiction: {
      value: jurisdictionVal,
      confidence: 0.9,
      source: provinceMatch ? 'user_text' : 'default',
      province,
    },
    income_type: incomeTypes,
    business_sector: [],
    tax_intent: {
      primary: {
        value: primaryIntent,
        confidence: 0.9,
        source: 'user_text',
      },
      secondary: secondaryIntents,
    },
    tax_category: taxCategories,
    facts,
    missing_facts: missingFacts,
    meta: {
      layer: 'L1',
      confidence,
      degraded: false,
      l2_used: false,
      latency_ms: latencyMs,
    },
  };
}

/**
 * REFINEMENT L2 (GATED DECISION MODEL)
 *
 * Kích hoạt khi độ tự tin L1 thấp (< 0.75), gặp nhãn UNKNOWN, hoặc khi DECISION_MODE yêu cầu (forceL2 = true)
 */
export async function refineQueryWithL2(
  frame: TaxDecisionFrame,
  query: string,
  provider?: any,
  forceL2 = false
): Promise<TaxDecisionFrame> {
  if (!provider) return frame;

  const hasUnknownTaxpayer = frame.taxpayer_type.value === 'UNKNOWN';
  const hasUnknownIncome = frame.income_type.length === 0 || frame.income_type[0]?.value === 'UNKNOWN';
  const needsSemanticHelp =
    (frame.tax_intent.primary.value === 'TAX_CALCULATION' && hasUnknownIncome) ||
    (hasUnknownTaxpayer && hasUnknownIncome) ||
    (['CORRECTION', 'TOPIC_SWITCH'].includes(frame.conversation_act.value) && frame.meta.confidence < 0.75);

  if (!forceL2 && !needsSemanticHelp) {
    return frame;
  }

  try {
    const updated = { ...frame };
    if (typeof provider.classifyAll === 'function') {
      const allRes = await provider.classifyAll(query);
      if (allRes) {
        let changed = false;
        if (allRes.taxpayer && allRes.taxpayer !== 'UNKNOWN' && allRes.taxpayerConf >= 0.7 && frame.taxpayer_type.source !== 'user_text') {
          updated.taxpayer_type = {
            value: allRes.taxpayer,
            confidence: allRes.taxpayerConf,
            source: 'llm',
          };
          changed = true;
        }
        if (allRes.income && allRes.income !== 'UNKNOWN' && allRes.incomeConf >= 0.7 && frame.income_type[0]?.source !== 'user_text') {
          updated.income_type = [{
            value: allRes.income,
            confidence: allRes.incomeConf,
            source: 'llm',
          }];
          changed = true;
        }
        if (allRes.intent && allRes.intentConf >= 0.7 && frame.tax_intent.primary.source !== 'user_text') {
          updated.tax_intent.primary = {
            value: allRes.intent,
            confidence: allRes.intentConf,
            source: 'llm',
          };
          changed = true;
        }
        if (!changed) return frame;
        updated.meta = {
          ...frame.meta,
          layer: 'L2',
          l2_used: true,
          confidence: Math.min(allRes.taxpayerConf || 0.8, allRes.incomeConf || 0.8, allRes.intentConf || 0.8),
          latency_ms: (frame.meta.latency_ms || 0) + (allRes.durationMs || 0),
        };
        return updated;
      }
    }

    let l2Triggered = false;
    if ((hasUnknownTaxpayer || frame.taxpayer_type.confidence < 0.7 || forceL2) && frame.taxpayer_type.source !== 'user_text') {
      const res = await provider.classifyTaxpayer(query);
      if (res && res.taxpayer !== 'UNKNOWN') {
        updated.taxpayer_type = {
          value: res.taxpayer,
          confidence: res.confidence,
          source: 'llm',
        };
        l2Triggered = true;
      }
    }

    if ((hasUnknownIncome || frame.income_type[0]?.confidence < 0.7 || forceL2) && frame.income_type[0]?.source !== 'user_text') {
      const res = await provider.classifyIncome(query);
      if (res && res.income !== 'UNKNOWN') {
        updated.income_type = [{
          value: res.income,
          confidence: res.confidence,
          source: 'llm',
        }];
        l2Triggered = true;
      }
    }

    if (l2Triggered) {
      updated.meta = {
        ...frame.meta,
        layer: 'L2',
        l2_used: true,
        confidence: Math.max(frame.meta.confidence, 0.9),
      };
    }
    return updated;
  } catch (err) {
    console.error('[L2_GATE_ERR]', err);
    return frame;
  }
}

