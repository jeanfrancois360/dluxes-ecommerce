import { PageLayout } from '@/components/layout/page-layout';
import { getTranslations } from 'next-intl/server';

export default async function AboutPage() {
  const t = await getTranslations('about');

  const values = [
    { title: t('qualityFirst'), description: t('qualityFirstDesc') },
    { title: t('sustainableDesign'), description: t('sustainableDesignDesc') },
    { title: t('customerDelight'), description: t('customerDelightDesc') },
  ];

  const team = [
    { name: 'Emma Davidson', role: t('founderCEO') },
    { name: 'James Chen', role: t('designDirector') },
    { name: 'Sarah Williams', role: t('headOfCuration') },
    { name: 'Michael Brown', role: t('customerExperience') },
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-white">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
            {t('ourStory')}
          </h1>
          <p className="text-xl md:text-2xl text-white/80">
            {t('craftingSince')}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-6">{t('ourMission')}</h2>
              <p className="text-lg text-neutral-700 mb-4">
                {t('missionText1')}
              </p>
              <p className="text-lg text-neutral-700">
                {t('missionText2')}
              </p>
            </div>
            <div className="h-96 bg-neutral-100 rounded-2xl flex items-center justify-center">
              <svg className="w-48 h-48 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">{t('ourValues')}</h2>
            <p className="text-xl text-neutral-600">
              {t('valuesPrinciples')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-gold">{index + 1}</span>
                </div>
                <h3 className="text-2xl font-serif font-bold mb-4">{value.title}</h3>
                <p className="text-neutral-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">{t('meetOurTeam')}</h2>
            <p className="text-xl text-neutral-600">
              {t('teamSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-48 h-48 mx-auto bg-neutral-100 rounded-full mb-4 flex items-center justify-center">
                  <svg className="w-24 h-24 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-neutral-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
