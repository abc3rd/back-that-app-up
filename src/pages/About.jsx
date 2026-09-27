import landingHtml from '../landing.html?raw';

export default function About() {
  return (
    <iframe
      srcDoc={landingHtml}
      title="Back That App Up! — Landing"
      className="h-[100dvh] w-full border-0"
    />
  );
}