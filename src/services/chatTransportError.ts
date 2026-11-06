/** Distinguish browser connection/stream failures; never retry a paid request automatically. */
export function chatTransportError(error:{name?:string;message?:string},phase:'connect'|'read',reference=''):string{
 if(error?.name==='AbortError')return 'Yêu cầu đã được hủy.';
 const message=error?.message||'';
 const network=error?.name==='TypeError'||/load failed|failed to fetch|networkerror|network request failed|network.*lost/i.test(message);
 if(!network)return message||'Không thể hoàn tất câu trả lời. Vui lòng thử lại.';
 const code=phase==='connect'?'NETWORK_CONNECT':'STREAM_INTERRUPTED';
 const safeReference=/^[a-zA-Z0-9-]{1,80}$/.test(reference)?` · ${reference}`:'';
 return (phase==='connect'?'Không kết nối được tới dịch vụ trả lời. Kiểm tra kết nối mạng rồi thử lại.':'Kết nối bị ngắt khi đang nhận câu trả lời. Vui lòng kiểm tra lịch sử và số dư trước khi gửi lại.')+` (${code}${safeReference})`;
}
