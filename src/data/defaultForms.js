// Initial field definitions for the two website forms. They mirror the original hard-coded forms and are only
// written when a form does not exist in the database yet - after that the admin panel is the source of truth.

const BIHAR_DISTRICTS = [
  'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 'Darbhanga',
  'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj',
  'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia',
  'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul',
  'Vaishali', 'West Champaran',
]

const opt = (value, en = value, hi = '') => ({ value, label: { en, hi } })
const districtOptions = () => BIHAR_DISTRICTS.map((d) => opt(d))

export const defaultForms = [
  {
    key: 'agenda',
    title: 'Agenda - Delegate Registration',
    referencePrefix: 'BST',
    fields: [
      {
        key: 'fullName',
        type: 'text',
        required: true,
        label: { en: 'Full name', hi: 'पूरा नाम' },
        placeholder: { en: 'Enter your full name', hi: 'अपना पूरा नाम दर्ज करें' },
      },
      {
        key: 'organisation',
        type: 'text',
        required: true,
        label: { en: 'Organisation / Institution', hi: 'संस्था / संगठन' },
        placeholder: { en: 'Enter your organisation name', hi: 'अपनी संस्था का नाम दर्ज करें' },
      },
      {
        key: 'email',
        type: 'email',
        required: true,
        label: { en: 'Email address', hi: 'ईमेल पता' },
        placeholder: { en: 'name@organisation.com', hi: 'name@organisation.com' },
      },
      {
        key: 'mobile',
        type: 'tel',
        required: true,
        label: { en: 'Mobile number (+91)', hi: 'मोबाइल नंबर (+91)' },
        placeholder: { en: '9153881025', hi: '9153881025' },
      },
      {
        key: 'district',
        type: 'select',
        required: true,
        label: { en: 'District', hi: 'जिला' },
        placeholder: { en: 'Select district', hi: 'जिला चुनें' },
        options: [...districtOptions(), opt('Outside Bihar', 'Outside Bihar / Other state', 'बिहार से बाहर / अन्य राज्य')],
      },
      {
        key: 'category',
        type: 'select',
        required: true,
        label: { en: 'Delegate category', hi: 'प्रतिनिधि श्रेणी' },
        defaultValue: 'Hotels, Resorts & Hospitality',
        options: [
          opt('Hotels, Resorts & Hospitality', undefined, 'होटल, रिसॉर्ट एवं आतिथ्य उद्योग'),
          opt('Travel Agency, Tour Operator & DMC', undefined, 'ट्रैवल एजेंसी, टूर ऑपरेटर एवं डीएमसी'),
          opt('Government & District Administration', undefined, 'शासन एवं जिला प्रशासन'),
          opt('Chef & Food & Beverage Professional', undefined, 'शेफ एवं खानपान विशेषज्ञ'),
          opt('Investor & Entrepreneur', undefined, 'निवेशक एवं उद्यमी'),
          opt('Academic, Researcher & Student', undefined, 'शिक्षाविद, शोधार्थी एवं विद्यार्थी'),
          opt('Media & Press', undefined, 'मीडिया एवं प्रेस'),
          opt('Other Industry Representative', undefined, 'अन्य उद्योग प्रतिनिधि'),
        ],
      },
      {
        key: 'daysAttending',
        type: 'radio',
        required: true,
        width: 'full',
        label: { en: 'Days attending', hi: 'उपस्थिति के दिन' },
        defaultValue: 'Both Days (7 & 8 Dec 2026)',
        options: [
          opt('Both Days (7 & 8 Dec 2026)', undefined, 'दोनों दिन (7 और 8 दिसंबर 2026)'),
          opt('Day 1 only (7 Dec 2026)', undefined, 'केवल दिन 1 (7 दिसंबर 2026)'),
          opt('Day 2 only (8 Dec 2026)', undefined, 'केवल दिन 2 (8 दिसंबर 2026)'),
        ],
      },
      {
        key: 'notes',
        type: 'textarea',
        width: 'full',
        label: {
          en: 'Questions or topics for panelists (optional)',
          hi: 'पैनलिस्टों के लिए कोई विशेष प्रश्न या सुझाव (वैकल्पिक)',
        },
        placeholder: {
          en: 'Any specific topics or queries you would like addressed during the panels...',
          hi: 'सत्रों के दौरान आप किन विषयों या सवालों पर चर्चा चाहते हैं...',
        },
      },
      {
        key: 'agreed',
        type: 'checkbox',
        required: true,
        width: 'full',
        label: {
          en: 'I agree to be contacted by Bihar Setu regarding session passes and summit schedule updates.',
          hi: 'मैं सत्र पास और कार्यसूची अपडेट के संबंध में बिहार सेतु द्वारा संपर्क किए जाने की सहमति देता/देती हूँ।',
        },
      },
    ],
  },
  {
    key: 'enquire',
    title: 'Enquire Now',
    referencePrefix: 'BSE',
    fields: [
      {
        key: 'fullName',
        type: 'text',
        required: true,
        label: { en: 'Full name', hi: 'पूरा नाम' },
        placeholder: { en: 'Enter your full name', hi: 'अपना पूरा नाम दर्ज करें' },
      },
      {
        key: 'organisation',
        type: 'text',
        label: { en: 'Organisation', hi: 'संस्थान / कंपनी' },
        placeholder: { en: 'Enter your organisation / company', hi: 'अपने संस्थान या कंपनी का नाम दर्ज करें' },
      },
      {
        key: 'email',
        type: 'email',
        required: true,
        label: { en: 'Email address', hi: 'ईमेल पता' },
        placeholder: { en: 'name@example.com', hi: 'name@example.com' },
      },
      {
        key: 'mobile',
        type: 'tel',
        required: true,
        label: { en: 'Mobile number (+91)', hi: 'मोबाइल नंबर (+91)' },
        placeholder: { en: 'Enter 10-digit mobile number', hi: '10-अंकों का मोबाइल नंबर दर्ज करें' },
      },
      {
        key: 'district',
        type: 'select',
        label: { en: 'District', hi: 'ज़िला' },
        placeholder: { en: 'Select district', hi: 'ज़िला चुनें' },
        options: districtOptions(),
      },
      {
        key: 'category',
        type: 'select',
        label: { en: 'Enquiry category', hi: 'पूछताछ श्रेणी' },
        defaultValue: 'General enquiry',
        options: [
          'General enquiry',
          'Speaker enquiry',
          'Sponsor enquiry',
          'Media enquiry',
          'Association enquiry',
          'Institutional partnership',
          'Corporate partnership',
          'Knowledge partnership',
          'Technology partnership',
          'Submit an initiative',
          'Other',
        ].map((c) => opt(c)),
      },
      {
        key: 'message',
        type: 'textarea',
        width: 'full',
        label: { en: 'Message', hi: 'संदेश' },
        placeholder: {
          en: 'Tell us how you would like to collaborate or enquire...',
          hi: 'कृपया अपनी पूछताछ या सहभागिता का विवरण लिखें...',
        },
      },
      {
        key: 'agreed',
        type: 'checkbox',
        required: true,
        width: 'full',
        label: {
          en: 'I agree to be contacted by Bihar Setu about this enquiry.',
          hi: 'मैं इस पूछताछ के संबंध में बिहार सेतु द्वारा संपर्क किए जाने की सहमति देता/देती हूँ।',
        },
      },
    ],
  },
]

export async function seedForms(FormDefinition) {
  for (const form of defaultForms) {
    const exists = await FormDefinition.exists({ key: form.key })
    if (!exists) {
      await FormDefinition.create(form)
      console.log(`Seeded form definition: ${form.key}`)
    }
  }
}
