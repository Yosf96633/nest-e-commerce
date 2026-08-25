import { Inject, Injectable } from '@nestjs/common';
import { RESEND_CLIENT } from './resend.provider';
import { type Resend } from "resend"
import { getVerificationEmailTemplate } from './template/verification.template';

@Injectable()
export class ResendService {
    constructor(@Inject(RESEND_CLIENT) private readonly resend: Resend) { }

    async send_verification_email(email: string, link: string) {
        const response = await this.resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Verify Your Email",
            html: getVerificationEmailTemplate(link)
        })
        if (!response.data?.id) {
            console.log("error sending verification email");

        }

        return response.data?.id;
    }
}
