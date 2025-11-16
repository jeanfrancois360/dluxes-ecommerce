import { baseEmailTemplate } from './base.template';

export const welcomeTemplate = (name: string) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10B981 0%, #047857 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 28px; font-weight: 700; margin-bottom: 16px; text-align: center; letter-spacing: -0.5px;">
      Welcome to Luxury Collection
    </h2>

    <p style="color: #525252; font-size: 18px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${name}, we're thrilled to have you join our exclusive community.
    </p>

    <div style="background: linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 20px; font-weight: 600; margin-bottom: 24px; text-align: center;">
        What's Next?
      </h3>

      <div style="display: grid; gap: 20px;">
        <!-- Step 1 -->
        <div style="display: flex; gap: 16px;">
          <div style="flex-shrink: 0; width: 48px; height: 48px; background: #CBB57B; border-radius: 12px; display: flex; align-items: center; justify-center; color: #000000; font-weight: 700; font-size: 18px;">
            1
          </div>
          <div>
            <h4 style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              Complete Your Profile
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5;">
              Add your preferences and delivery details for a personalized experience.
            </p>
          </div>
        </div>

        <!-- Step 2 -->
        <div style="display: flex; gap: 16px;">
          <div style="flex-shrink: 0; width: 48px; height: 48px; background: #CBB57B; border-radius: 12px; display: flex; align-items: center; justify-center; color: #000000; font-weight: 700; font-size: 18px;">
            2
          </div>
          <div>
            <h4 style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              Browse Our Collection
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5;">
              Explore our curated selection of premium luxury items.
            </p>
          </div>
        </div>

        <!-- Step 3 -->
        <div style="display: flex; gap: 16px;">
          <div style="flex-shrink: 0; width: 48px; height: 48px; background: #CBB57B; border-radius: 12px; display: flex; align-items: center; justify-center; color: #000000; font-weight: 700; font-size: 18px;">
            3
          </div>
          <div>
            <h4 style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              Enable Two-Factor Authentication
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5;">
              Secure your account with an extra layer of protection.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="{{SITE_URL}}"
         style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #262626 100%); color: #FFFFFF; padding: 16px 48px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); margin-right: 12px;">
        Start Shopping
      </a>
    </div>

    <div style="background-color: #FAFAFA; border-left: 4px solid #CBB57B; padding: 20px; border-radius: 8px; margin-top: 32px;">
      <p style="color: #525252; font-size: 14px; line-height: 1.6;">
        <strong style="color: #000000;">🎁 Welcome Offer:</strong><br/>
        Enjoy <span style="color: #CBB57B; font-weight: 600;">15% off</span> your first purchase with code:
        <strong style="color: #000000; font-size: 16px; letter-spacing: 1px;">WELCOME15</strong>
      </p>
    </div>

    <p style="color: #737373; font-size: 14px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Need help getting started?<br/>
      <a href="{{SUPPORT_URL}}" style="color: #CBB57B; text-decoration: none; font-weight: 500;">Contact our support team</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
