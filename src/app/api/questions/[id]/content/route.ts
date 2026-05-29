import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import supabaseAdmin from '@/lib/supabase/admin'

function extractLatex(markdown: string): string[] {
  const formulas: string[] = []
  // Block: $$...$$
  const blockRegex = /\$\$([\s\S]*?)\$\$/g
  let match
  while ((match = blockRegex.exec(markdown)) !== null) {
    const formula = match[1].trim()
    if (formula) formulas.push(formula)
  }
  // Inline: $...$ (not $$)
  const inlineRegex = /(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g
  while ((match = inlineRegex.exec(markdown)) !== null) {
    const formula = match[1].trim()
    if (formula) formulas.push(formula)
  }
  return [...new Set(formulas)]
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const questionId = params.id
    const { content_text, content_rich } = await request.json()

    if (!content_text) {
      return NextResponse.json({ error: 'Missing content_text' }, { status: 400 })
    }

    // Verify question ownership
    const { data: question } = await supabase
      .from('question_blocks')
      .select('id, note_id')
      .eq('id', questionId)
      .single()

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const formulaLatex = extractLatex(content_text)

    // Upsert into note_content_entries
    const { data: existing } = await supabase
      .from('note_content_entries')
      .select('id')
      .eq('question_block_id', questionId)
      .eq('content_type', 'solution')
      .single()

    let result
    if (existing) {
      result = await supabaseAdmin
        .from('note_content_entries')
        .update({
          content_text,
          content_rich: content_rich || { type: 'markdown', version: 1 },
          formula_latex: formulaLatex.length > 0 ? formulaLatex : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      result = await supabaseAdmin.from('note_content_entries').insert({
        question_block_id: questionId,
        note_id: question.note_id,
        content_type: 'solution',
        content_text,
        content_rich: { type: 'markdown', version: 1 },
        formula_latex: formulaLatex.length > 0 ? formulaLatex : null,
      })
    }

    if (result.error) {
      console.error('Error saving note content:', result.error)
      return NextResponse.json({ error: '保存失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true, formula_count: formulaLatex.length })
  } catch (error) {
    console.error('Save note content error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
