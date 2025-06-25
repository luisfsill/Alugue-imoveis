import { useState, useEffect } from 'react';
import { Building2, MapPin, Search, CircleDollarSign } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getFeaturedProperties } from '../services';
import type { Property } from '../types/property';
import { Bed, Bath, Square } from 'lucide-react';
import React, { Suspense } from 'react';

const ImageCarousel = React.lazy(() => import('../components/ImageCarousel'));

function Home() {
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchType, setSearchType] = useState<'sale' | 'rent' | ''>('');
  
  useEffect(() => {
    const loadFeaturedProperties = async () => {
      try {
        const properties = await getFeaturedProperties();
        setFeaturedProperties(properties);
      } catch (error) {
        console.error('Erro ao carregar imóveis em destaque:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFeaturedProperties();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) {
      params.append('location', searchLocation);
    }
    if (searchType) {
      params.append('type', searchType);
    }
    navigate({
      pathname: '/properties',
      search: params.toString(),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header com título e logo */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 md:py-12 -mx-4 md:mx-0 px-4 md:px-0 md:rounded-lg">
        <div className="container mx-auto px-4 md:px-4 text-center">
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 md:space-x-4 lg:space-x-5 xl:space-x-6 mb-3 md:mb-4">
            <img 
              src="/Logo-JM 1.webp" 
              alt="Logo JM" 
              className="h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18 lg:h-20 lg:w-20 xl:h-24 xl:w-24 object-contain"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Alugue e Compre Imóveis em Escarpas e Região</h1>
          </div>
          <p className="text-base md:text-lg lg:text-xl text-blue-100 max-w-2xl md:max-w-3xl mx-auto">
            Encontre o imóvel perfeito para você
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="bg-white shadow-md py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por localização..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Property Type Dropdown */}
                <div className="w-full sm:w-1/2">
                  <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Imóvel
                  </label>
                  <select 
                    id="propertyType"
                    className="w-full px-4 py-3 rounded-lg border text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'sale' | 'rent' | '')}
                  >
                    <option value="">Tipo de Imóvel</option>
                    <option value="sale">Venda</option>
                    <option value="rent">Aluguel</option>
                  </select>
                </div>
                {/* Search Button */}
                <button 
                  onClick={handleSearch}
                  className="w-full sm:w-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Buscar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Imóveis em Destaque</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Carregando imóveis em destaque...</p>
              </div>
            </div>
          ) : featuredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhum imóvel em destaque no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProperties.slice(0, 4).map((property, propertyIndex) => (
                <div key={propertyIndex} className="bg-white p-4 rounded-lg shadow-md relative group">
                  {/* Carousel de Imagens */}
                  <div className="mb-4">
                    <Suspense fallback={
                      <div className="flex justify-center items-center h-[200px]">
                        <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-2 text-blue-600">Carregando imagens...</span>
                      </div>
                    }>
                      <ImageCarousel
                        images={property.images.map((src, index) => ({
                          src,
                          alt: `${property.title} - Imagem ${index + 1}`
                        }))}
                        initialIndex={property.coverPhotoIndex || 0}
                        height="h-[200px]"
                        showNavigation={true}
                        autoPlay={false}
                        className="group"
                      />
                    </Suspense>
                  </div>
                  <h3 className="text-xl font-bold mb-2 h-14 md:h-auto md:truncate">{property.title}</h3>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="text-sm">{property.location}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <Bed className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                      <span className="block text-xs text-gray-600">{property.bedrooms} Quartos</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <Bath className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                      <span className="block text-xs text-gray-600">{property.bathrooms} Banheiros</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <Square className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                      <span className="block text-xs text-gray-600">{property.area}m²</span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-blue-600 mb-4">
                    {property.price === 0 && property.type === 'rent' ? 'A consultar!' : `R$ ${property.price.toLocaleString('pt-BR')}${property.type === 'rent' ? '/mês' : ''}`}
                  </div>
                  <Link to={`/properties/${property.id}`} className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold">
                    Ver mais detalhes
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promotional Section */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 md:pl-4 lg:pl-8">
              <h2 className="text-4xl font-bold">Anuncie seu Imóvel</h2>
              <p className="text-xl">
                Alcance milhares de compradores e inquilinos interessados.
                Nossa plataforma oferece:
              </p>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <Building2 className="w-6 h-6 flex-shrink-0 text-yellow-400" />
                  <span>Exposição para um público qualificado</span>
                </li>
                <li className="flex items-center space-x-3">
                  <MapPin className="w-6 h-6 flex-shrink-0 text-green-400" />
                  <span>Destaque regional para seu imóvel</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CircleDollarSign className="w-6 h-6 flex-shrink-0 text-red-400" />
                  <span>Melhor retorno do mercado</span>
                </li>
              </ul>
              <a 
                href="https://wa.me/5537999216351?text=Gostaria%20de%20anunciar%20minha%20casa%20no%20seu%20site!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Anunciar Agora
              </a>
            </div>
            {/* Image with gradients */}
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
              <img
                src="https://plus.unsplash.com/premium_photo-1661752229232-96232a11c62b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Anuncie seu imóvel"
                className="w-full h-full object-cover"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/90 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/90 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Por Que Nos Escolher</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <Building2 className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ampla Variedade de Imóveis</h3>
            <p className="text-gray-600">Encontre o imóvel perfeito em nossa extensa coleção</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <MapPin className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Localizações Privilegiadas</h3>
            <p className="text-gray-600">Imóveis nos bairros mais desejados</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CircleDollarSign className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Melhores Preços do Mercado</h3>
            <p className="text-gray-600">Preços competitivos para venda e locação</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;