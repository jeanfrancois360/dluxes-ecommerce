const EasyPost = require('@easypost/api');

const apiKey = 'EZTKc44aba3f57f8471ca9f0277ab3200059q76d49lVTwqLyXrRLEhB5Q';

console.log('Testing EasyPost API key:', apiKey.substring(0, 10) + '...');
console.log('');

const client = new EasyPost(apiKey);

async function test() {
  try {
    console.log('Testing CarrierAccount.all()...');
    const carriers = await client.CarrierAccount.all();
    console.log('✅ SUCCESS! Found', carriers.length, 'carriers');
    if (carriers.length > 0) {
      console.log(
        'First 5 carriers:',
        carriers.slice(0, 5).map((c) => c.readable || c.type)
      );
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('Error code:', error.code);
    console.log('Full error:', JSON.stringify(error, null, 2));
  }
}

test();
