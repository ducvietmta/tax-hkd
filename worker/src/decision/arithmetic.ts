/** Exact arithmetic only. No tax thresholds, sectors, case IDs or legal rules.
 * The model proposes the operation and cited premises; code computes the value.
 * Successful arithmetic never certifies that those legal premises apply. */
type Fraction={n:bigint;d:bigint};
const gcd=(a:bigint,b:bigint):bigint=>{a=a<0n?-a:a;while(b){[a,b]=[b,a%b];}return a||1n;};
const fraction=(n:bigint,d=1n):Fraction=>{if(!d)throw Error('DIVISION_BY_ZERO');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};};
export function exactArithmetic(expression:string):Fraction{
 if(typeof expression!=='string'||!expression.trim()||expression.length>600||/[^\d.\s+*/()%\-]/.test(expression))throw Error('INVALID_EXPRESSION');
 const tokens=expression.match(/\d+(?:\.\d+)?|[+*/()%\-]/g)||[];if(tokens.length>160)throw Error('EXPRESSION_LIMIT');
 if(tokens.join('')!==expression.replace(/\s/g,''))throw Error('INVALID_TOKEN');
 let i=0,depth=0;
 const value=():Fraction=>{if(++depth>24)throw Error('EXPRESSION_DEPTH');let v:Fraction;
  if(tokens[i]==='+'||tokens[i]==='-'){const negative=tokens[i++]==='-';v=value();if(negative)v={...v,n:-v.n};}
  else if(tokens[i]==='('){i++;v=sum();if(tokens[i++]!==')')throw Error('UNBALANCED_EXPRESSION');}
  else{const token=tokens[i++];if(!token||!/^\d+(?:\.\d+)?$/.test(token)||token.length>40)throw Error('INVALID_OPERAND');const [whole,decimal='']=token.split('.');v=fraction(BigInt(whole+decimal),10n**BigInt(decimal.length));}
  while(tokens[i]==='%'){i++;v=fraction(v.n,v.d*100n);}depth--;return v;
 };
 const product=():Fraction=>{let a=value();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=value();a=op==='*'?fraction(a.n*b.n,a.d*b.d):fraction(a.n*b.d,a.d*b.n);}return a;};
 const sum=():Fraction=>{let a=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();a=fraction(a.n*b.d+(op==='+'?b.n:-b.n)*a.d,a.d*b.d);}return a;};
 const result=sum();if(i!==tokens.length)throw Error('TRAILING_OPERAND');
 if(result.n>BigInt(Number.MAX_SAFE_INTEGER)*result.d||result.n<-BigInt(Number.MAX_SAFE_INTEGER)*result.d)throw Error('RESULT_LIMIT');
 return result;
}
function decimalText(v:Fraction):string{
 const negative=v.n<0n;let n=negative?-v.n:v.n;const whole=n/v.d;let remainder=n%v.d,tail='';
 for(let i=0;i<8&&remainder;i++){remainder*=10n;tail+=(remainder/v.d).toString();remainder%=v.d;}
 return (negative?'-':'')+whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.')+(tail?','+tail+(remainder?'…':''):'');
}
export interface CalculationRecord {expression:string;evidence_ids:string[];numerator:string;denominator:string;display:string;}
export function resolveCalculations(text:string,evidenceIds:string[]){
 const records:CalculationRecord[]=[],issues:string[]=[],known=new Set(evidenceIds);
 const rendered=text.replace(/\[\[CALC:(\{[^\r\n]*?\})\]\]/g,(marker,json)=>{
  try{
   if(records.length>=48)throw Error('CALCULATION_LIMIT');const spec=JSON.parse(json);
   if(spec.unit!=='VND'||!Array.isArray(spec.evidence_ids)||!spec.evidence_ids.length||spec.evidence_ids.some((id:unknown)=>typeof id!=='string'||!known.has(id)))throw Error('CALCULATION_EVIDENCE_REQUIRED');
   const value=exactArithmetic(spec.expression),display=decimalText(value)+' đồng';
   records.push({expression:spec.expression,evidence_ids:[...new Set<string>(spec.evidence_ids)],numerator:value.n.toString(),denominator:value.d.toString(),display});return display;
  }catch(error){issues.push(error instanceof Error?error.message:'INVALID_CALCULATION');return marker;}
 });
 if(rendered.includes('[[CALC:'))issues.push('UNRESOLVED_CALCULATION');
 return {text:rendered,records,issues:[...new Set(issues)]};
}
export const ARITHMETIC_INSTRUCTIONS=`TÍNH SỐ HỌC CÓ NGUỒN:
- Bảng tính từ engine, nếu có, là dữ liệu có điều kiện: chỉ dùng khi đúng chủ thể, vai trò số liệu, phương pháp và nhóm hoạt động của câu hỏi. Không dùng nhãn tổng quát để gán tỷ lệ sai.
- Thiếu bảng tính engine không phải thiếu luật hay dữ kiện người hỏi. Khi câu hỏi và nguồn đủ cho một phép tính/nhánh giả định, phải trả cả kết quả, không dừng ở công thức hoặc xin lại dữ kiện đã có.
- Với mỗi số tiền mới cần tính, xuất trực tiếp tại vị trí kết quả bằng cú pháp [[CALC:{"expression":"(120 - 20) * 3 / 100","unit":"VND","evidence_ids":["E1"]}]]. Code sẽ thay bằng giá trị chính xác trước khi hiển thị và kiểm chứng. Expression chỉ có chữ số, dấu chấm thập phân, + - * / %, ngoặc; không dấu phân cách hàng nghìn, không tên biến. Dùng evidence_id THỰC trong nguồn cho tiền đề pháp lý. Đây chỉ là công cụ số học, không tự xác nhận nguồn hoặc đủ điều kiện.
- Nêu công thức/cơ sở dễ đọc, dùng thẻ cho kết quả cuối; không tự chép lại kết quả đã tính ngoài thẻ. Mỗi sắc thuế và mỗi phương pháp/kịch bản có kết quả riêng. Nếu số lẻ dưới đồng, giữ biểu thức chính xác và phân biệt với quy tắc làm tròn kê khai; không làm tròn doanh thu để so ngưỡng.
- Phương pháp chưa rõ thì tính các nhánh có điều kiện đủ dữ kiện, không chốt một nhánh là nghĩa vụ duy nhất. Khoản nộp thay chỉ đối trừ khi loại thuế/chủ thể/kỳ/chứng từ đã được xác nhận; thiếu điều kiện đó không ngăn tính phần nghĩa vụ trước đối trừ.
- Giữ dấu nguồn [[E:...;R:...]] cho kết luận và phép tính. Không dùng công cụ để bịa tỷ lệ/luật hoặc tự hợp thức hóa một khoản thuế chưa rõ.`;
