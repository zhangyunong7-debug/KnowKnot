import { NextRequest, NextResponse } from 'next/server'

// 文件上传 API
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'files'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 获取用户认证
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 调用 Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const response = await fetch(
      `${supabaseUrl}/functions/v1/file-upload`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.message }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Upload Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
