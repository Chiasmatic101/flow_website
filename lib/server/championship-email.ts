import 'server-only'
import { Resend } from 'resend'
import type { Mailer } from './championship-service'

export function inviteEmail(url: string) {
  const safeUrl = url.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  return {
    subject: 'Your Mina Tests invite',
    text: `MINA TESTS\n\nYou're invited.\n\nYour Mina Tests invite is ready.\n\nTrack your sleep. Test your brain. Explore how you change over time.\n\nJoin Mina Tests: ${url}\n\nCommunity experiments into sleep, sound and cognition.\nThis private invite expires in 7 days. You join after confirming the invite.\nIf you did not request this invite, you can ignore it.`,
    html: `<div style="background:#0d0e20;color:#f4f2ff;padding:32px 20px;font-family:Arial,sans-serif"><div style="max-width:480px;margin:auto"><p style="color:#70dfff;font-size:12px;font-weight:bold;letter-spacing:2px">MINA TESTS</p><h1 style="font-size:36px">You're invited.</h1><p style="line-height:1.7">Your Mina Tests invite is ready.</p><p style="line-height:1.7">Track your sleep.<br>Test your brain.<br>Explore how you change over time.</p><a href="${safeUrl}" style="display:inline-block;background:#6656ef;color:white;padding:18px 22px;border-radius:14px;text-decoration:none;font-weight:bold">JOIN MINA TESTS</a><p style="margin-top:28px;color:#b6eeff">Community experiments into sleep, sound and cognition.</p><p style="font-size:12px;color:#bdbbd4;line-height:1.7">This private invite expires in 7 days. You join after confirming the invite.<br>If you did not request this invite, you can ignore it.</p></div></div>`,
  }
}
export function resendMailer(): Mailer {
  const key = process.env.RESEND_API_KEY
  const from = process.env.CHAMPIONSHIP_FROM_EMAIL
  return {
    configured: Boolean(key && from),
    async send(email, url, idempotencyKey) {
      if (!key || !from) throw new Error('Email not configured')
      const { data, error } = await new Resend(key).emails.send({ from, to: [email], ...inviteEmail(url) }, { idempotencyKey })
      if (error || !data?.id) throw new Error('Email request not accepted')
    },
  }
}
