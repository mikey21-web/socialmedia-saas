export async function writeCopy(topic: string) {
  return { subject: `[Campaign] ${topic.substring(0, 30)}...`, body: `Email body about ${topic}`, ctr: Math.random() * 10 };
}
