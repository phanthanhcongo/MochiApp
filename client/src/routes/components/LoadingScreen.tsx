interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Đang tải...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md z-50">
      <div className="relative">
        {/* Outer rotating circle */}
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-transparent border-t-yellow-400 border-r-amber-500 border-b-orange-500 border-l-yellow-400"></div>
        {/* Inner counter-rotating circle for depth */}
        <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-4 border-transparent border-t-yellow-200 border-r-amber-200 border-b-orange-200 border-l-yellow-200 opacity-50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"></div>
      </div>
      <p className="mt-8 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{message}</p>
    </div>
  );
}

