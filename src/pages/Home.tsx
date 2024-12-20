import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-jl-cream">
      {/* Centered content container */}
      <div className="w-full max-w-2xl p-8">
        {/* Logo/Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold text-jl-teal mb-4">
            Jet Lag: Tel Aviv
          </h1>
          <p className="text-xl text-gray-700">
            A city-wide hide and seek game
          </p>
        </div>

        {/* Main Buttons */}
        <div className="space-y-4 w-full max-w-md mx-auto">
          <button
            onClick={() => navigate('/game')}
            className="w-full py-4 bg-jl-teal text-white text-xl font-display 
                     rounded-lg shadow-lg hover:bg-opacity-90 
                     transition-all transform hover:-translate-y-0.5"
          >
            Start Game
          </button>
          
          <button
            onClick={() => navigate('/rules')}
            className="w-full py-4 bg-white text-jl-teal text-xl font-display 
                     rounded-lg shadow-lg border-2 border-jl-teal 
                     hover:bg-jl-teal hover:text-white
                     transition-all transform hover:-translate-y-0.5"
          >
            Read Rules
          </button>
        </div>

        {/* Decorative elements using the logo's curved shapes */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-jl-yellow opacity-20 rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-jl-salmon opacity-20 rounded-tr-full"></div>
          <div className="absolute top-1/4 left-1/4 w-1/4 h-1/4 bg-jl-sage opacity-20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Home;