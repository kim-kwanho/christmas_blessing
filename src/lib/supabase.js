import { createClient } from '@supabase/supabase-js'

// .env 파일 생성이 차단되어 직접 입력합니다.
// 주의: 이 키가 Git에 커밋되지 않도록 주의하세요.
const supabaseUrl = 'https://yyrlgvdeosebssgksdtf.supabase.co'
const supabaseAnonKey = 'sb_publishable_N7kaBIKUWBV0c1KwNoq_Rg_4_nYZWzQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
