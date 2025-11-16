import { PageLayout } from '@/components/layout/page-layout';

export default function AboutPage() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-white">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
            Our Story
          </h1>
          <p className="text-xl md:text-2xl text-white/80">
            Crafting extraordinary living spaces since 2024
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-neutral-700 mb-4">
                At Luxury, we believe that your home should be a reflection of your unique style and aspirations. Our mission is to provide exceptional furniture and decor that transforms living spaces into extraordinary sanctuaries.
              </p>
              <p className="text-lg text-neutral-700">
                Every piece in our collection is carefully curated with meticulous attention to detail, quality craftsmanship, and timeless design. We partner with world-renowned designers and artisans to bring you furniture that stands the test of time.
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
            <h2 className="text-4xl font-serif font-bold mb-4">Our Values</h2>
            <p className="text-xl text-neutral-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Quality First',
                description: 'We never compromise on quality. Every product undergoes rigorous quality control to ensure it meets our exacting standards.',
              },
              {
                title: 'Sustainable Design',
                description: 'We are committed to sustainability, using eco-friendly materials and ethical manufacturing practices.',
              },
              {
                title: 'Customer Delight',
                description: 'Your satisfaction is our priority. From browsing to delivery, we ensure an exceptional experience at every touchpoint.',
              },
            ].map((value, index) => (
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
            <h2 className="text-4xl font-serif font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-neutral-600">
              Passionate experts dedicated to your perfect space
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { name: 'Emma Davidson', role: 'Founder & CEO' },
              { name: 'James Chen', role: 'Design Director' },
              { name: 'Sarah Williams', role: 'Head of Curation' },
              { name: 'Michael Brown', role: 'Customer Experience' },
            ].map((member, index) => (
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
