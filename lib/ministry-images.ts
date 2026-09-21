export interface MinistryImageEntry {
  src: string;
  alt: string;
}

export type MinistrySlug = string;

export const ministryImages: Record<MinistrySlug, MinistryImageEntry[]> = {
  children: [
    { src: "/CHILDREN%27S%20MINISTRY/DSC_0469.JPG", alt: "Children's Ministry — children gathered for a church activity" },
    { src: "/CHILDREN%27S%20MINISTRY/DSC_0473.JPG", alt: "Children's Ministry — children engaged in fellowship" },
    { src: "/CHILDREN%27S%20MINISTRY/DSC_0475.JPG", alt: "Children's Ministry — young ones participating in a program" },
    { src: "/CHILDREN%27S%20MINISTRY/DSC_0476.JPG", alt: "Children's Ministry — children learning and growing together" },
    { src: "/CHILDREN%27S%20MINISTRY/DSC_0477.JPG", alt: "Children's Ministry — children enjoying a church event" },
    { src: "/CHILDREN%27S%20MINISTRY/DSC_0478.JPG", alt: "Children's Ministry — children in worship and prayer" },
  ],
  youth: [
    { src: "/YOUTH%20MINISTRY/DSC_0427.JPG", alt: "Youth Ministry — young people gathered for fellowship" },
    { src: "/YOUTH%20MINISTRY/IMG_0806.JPG", alt: "Youth Ministry — youth group participating in an activity" },
    { src: "/YOUTH%20MINISTRY/IMG_0809.JPG", alt: "Youth Ministry — young people engaging in worship" },
    { src: "/YOUTH%20MINISTRY/IMG_0812.JPG", alt: "Youth Ministry — youth connecting and growing in faith" },
    { src: "/YOUTH%20MINISTRY/IMG_0816.JPG", alt: "Youth Ministry — youth enjoying a church event" },
    { src: "/YOUTH%20MINISTRY/IMG_0818.JPG", alt: "Youth Ministry — young people serving together" },
  ],
  women: [
    { src: "/WOMEN/DSC_0388.JPG", alt: "Women's Ministry — women gathered for fellowship" },
    { src: "/WOMEN/DSC_0389.JPG", alt: "Women's Ministry — women connecting in faith" },
    { src: "/WOMEN/DSC_0408.JPG", alt: "Women's Ministry — women participating in a church event" },
    { src: "/WOMEN/DSC_0409.JPG", alt: "Women's Ministry — women in worship and prayer" },
    { src: "/WOMEN/DSC_0411.JPG", alt: "Women's Ministry — women growing together in Christ" },
    { src: "/WOMEN/DSC_0415.JPG", alt: "Women's Ministry — women serving the church community" },
    { src: "/WOMEN/DSC_0428.JPG", alt: "Women's Ministry — women enjoying a special gathering" },
    { src: "/WOMEN/DSC_0460.JPG", alt: "Women's Ministry — women engaged in a group activity" },
    { src: "/WOMEN/DSC_0502.JPG", alt: "Women's Ministry — women celebrating together" },
    { src: "/WOMEN/DSC_0504.JPG", alt: "Women's Ministry — women in fellowship and study" },
    { src: "/WOMEN/DSC_1281.JPG", alt: "Women's Ministry — women gathered for a church program" },
  ],
  men: [
    { src: "/MEN%27S%20MINISTRY/DSC_0406.JPG", alt: "Men's Ministry — men gathered for fellowship" },
    { src: "/MEN%27S%20MINISTRY/DSC_0422.JPG", alt: "Men's Ministry — men connecting in faith" },
    { src: "/MEN%27S%20MINISTRY/DSC_0424.JPG", alt: "Men's Ministry — men participating in a church event" },
    { src: "/MEN%27S%20MINISTRY/DSC_0461.JPG", alt: "Men's Ministry — men growing together in Christ" },
    { src: "/MEN%27S%20MINISTRY/DSC_0481.JPG", alt: "Men's Ministry — men serving the church community" },
    { src: "/MEN%27S%20MINISTRY/DSC_0503.JPG", alt: "Men's Ministry — men in worship and prayer" },
    { src: "/MEN%27S%20MINISTRY/IMG_0782.JPG", alt: "Men's Ministry — men enjoying a special gathering" },
  ],
  worship: [
    { src: "/WORSHIP%20MINISTRY/DSC_0390.JPG", alt: "Worship Ministry — worshippers leading in praise" },
    { src: "/WORSHIP%20MINISTRY/DSC_0392.JPG", alt: "Worship Ministry — worship team in service" },
    { src: "/WORSHIP%20MINISTRY/DSC_0395.JPG", alt: "Worship Ministry — musicians playing during worship" },
    { src: "/WORSHIP%20MINISTRY/DSC_0396.JPG", alt: "Worship Ministry — singers leading the congregation" },
    { src: "/WORSHIP%20MINISTRY/DSC_0397.JPG", alt: "Worship Ministry — worship in spirit and truth" },
    { src: "/WORSHIP%20MINISTRY/DSC_0398.JPG", alt: "Worship Ministry — band performing during service" },
    { src: "/WORSHIP%20MINISTRY/DSC_0412.JPG", alt: "Worship Ministry — vocalists leading praise" },
    { src: "/WORSHIP%20MINISTRY/DSC_0413.JPG", alt: "Worship Ministry — worship team serving together" },
    { src: "/WORSHIP%20MINISTRY/DSC_0459.JPG", alt: "Worship Ministry — musicians and singers in harmony" },
    { src: "/WORSHIP%20MINISTRY/DSC_0490.JPG", alt: "Worship Ministry — leading the church in praise" },
    { src: "/WORSHIP%20MINISTRY/DSC_0496.JPG", alt: "Worship Ministry — Spirit-filled worship service" },
  ],
  prayer: [
    { src: "/PRAYER%20MINISTRY/DSC_0437.JPG", alt: "Prayer Ministry — members gathered in prayer" },
    { src: "/PRAYER%20MINISTRY/DSC_0438.JPG", alt: "Prayer Ministry — interceding for the church" },
    { src: "/PRAYER%20MINISTRY/DSC_0439.JPG", alt: "Prayer Ministry — standing together in prayer" },
    { src: "/PRAYER%20MINISTRY/DSC_0440.JPG", alt: "Prayer Ministry — persistent prayer for the community" },
    { src: "/PRAYER%20MINISTRY/DSC_0441.JPG", alt: "Prayer Ministry — members seeking God together" },
    { src: "/PRAYER%20MINISTRY/DSC_0442.JPG", alt: "Prayer Ministry — prayer gathering in progress" },
  ],
};

/**
 * Get images for a ministry by its slug.
 * Returns an empty array if no images are available.
 */
export function getMinistryImages(slug: string): MinistryImageEntry[] {
  return ministryImages[slug] ?? [];
}
