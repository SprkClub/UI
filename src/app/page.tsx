export default function Home() {
  return (
    <div className="min-h-screen w-full overflow-hidden">
      <iframe 
        src="https://sprkclub-fun.vercel.app/"
        className="w-full h-screen border-0"
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          userSelect: 'none',
          pointerEvents: 'auto'
        }}
        title="SprkClub.Fun Landing Page"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        allowFullScreen={false}
      />
    </div>
  );
}
