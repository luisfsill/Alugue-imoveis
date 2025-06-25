import { useEffect, useState, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sanitizeHTML } from '../utils/sanitize';
import { 
  Bed, 
  Bath, 
  Square, 
  MapPin, 
  Phone, 
  Mail, 
  Trees as Tree, 
  Car, 
  Shield, 
  Wind, 
  Refrigerator, 
  ArrowLeft 
} from 'lucide-react';
import { FaSwimmingPool } from "react-icons/fa";
import { getProperty } from '../services';
import type { Property } from '../types/property';
import { formatRefId } from '../utils/formatters';

const ImageGallery = lazy(() => import('../components/ImageGallery'));

function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryKey, setGalleryKey] = useState(0);

  useEffect(() => {
    const loadProperty = async () => {
      try {
        if (!id) {
          setError('ID do imóvel não encontrado');
          return;
        }
        const propertyData = await getProperty(id);
        setProperty(propertyData);
      } catch (err) {
        console.error('Erro ao carregar imóvel:', err);
        setError('Erro ao carregar informações do imóvel');
      } finally {
        setIsLoading(false);
      }
    };
    loadProperty();
  }, [id]);

  const formatPhoneNumber = (phone: string) => {
    const numericPhone = phone.replace(/\D/g, '');
    if (numericPhone.length === 13) {
      return `+${numericPhone.slice(0, 2)} (${numericPhone.slice(2, 4)}) ${numericPhone.slice(4, 9)}-${numericPhone.slice(9)}`;
    }
    if (numericPhone.length === 11) {
      return `(${numericPhone.slice(0, 2)}) ${numericPhone.slice(2, 7)}-${numericPhone.slice(7)}`;
    }
    return phone;
  };

  const getWhatsAppLink = (phone: string) => {
    if (!property) return '#';

    const numericPhone = phone.replace(/\D/g, '');
    const ref = property.ref_id ? formatRefId(property.ref_id) : '';

    const message = `Olá! Vi o anúncio do imóvel "${property.title}, ${ref}" no site Aluga Escarpas e gostaria de mais informações.`.trim().replace(/\s+/g, ' ');
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${numericPhone}?text=${encodedMessage}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Carregando informações do imóvel...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h2>
          <p className="text-gray-600">{error || 'Imóvel não encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 px-4 sm:px-0">
        {/* Back Button */}
        <Link
          to="/properties"
          onClick={() => setGalleryKey(prev => prev + 1)}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors group mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Voltar</span>
        </Link>
        {/* Thumbnail Gallery */}
        <Suspense fallback={
          <div className="flex justify-center items-center h-48">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-blue-600">Carregando galeria...</span>
          </div>
        }>
          <ImageGallery
            key={galleryKey}
            images={property.images.map((src, index) => ({
              src,
              alt: `${property.title} - Imagem ${index + 1}`
            }))}
            initialIndex={property.coverPhotoIndex || 0}
          />
        </Suspense>
        {/* Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex justify-between items-start">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{property.title}</h1>
                {property.ref_id && (
                  <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full ml-4 whitespace-nowrap">
                    {formatRefId(property.ref_id)}
                  </span>
                )}
              </div>
              <div className="flex items-center text-gray-600 mt-2">
                <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{property.location}</span>
              </div>
            </div>
            {/* Property Stats */}
            <div className="grid grid-cols-3 text-center text-gray-600 bg-gray-50 p-4 rounded-lg">
              <div className="space-y-1">
                <Bed className="w-6 h-6 mx-auto text-blue-600" />
                <div className="font-semibold">{property.bedrooms}</div>
                <div className="text-sm">Quartos</div>
              </div>
              <div className="space-y-1">
                <Bath className="w-6 h-6 mx-auto text-blue-600" />
                <div className="font-semibold">{property.bathrooms}</div>
                <div className="text-sm">Banheiros</div>
              </div>
              <div className="space-y-1">
                <Square className="w-6 h-6 mx-auto text-blue-600" />
                <div className="font-semibold">{property.area}</div>
                <div className="text-sm">m²</div>
              </div>
            </div>
            {/* Description */}
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">Descrição</h2>
              <pre 
                className="text-gray-600 leading-relaxed whitespace-pre-wrap font-sans select-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(property.description)
                }}
              />
            </div>
            {/* Features */}
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">Características</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.features.has_pool && (
                  <div className="flex items-center text-gray-600">
                    <FaSwimmingPool className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span>Piscina</span>
                  </div>
                )}
                {property.features.has_garden && (
                  <div className="flex items-center text-gray-600">
                    <Tree className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span>Jardim</span>
                  </div>
                )}
                {property.features.has_garage && (
                  <div className="flex items-center text-gray-600">
                    <Car className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span>Garagem</span>
                  </div>
                )}
                {property.features.has_security_system && (
                  <div className="flex items-center text-gray-600">
                    <Shield className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span>Sistema de Segurança</span>
                  </div>
                )}
                {property.features.has_air_conditioning && (
                  <div className="flex items-center text-gray-600">
                    <Wind className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span>Ar Condicionado Central</span>
                  </div>
                )}
                {property.features.has_premium_appliances && (
                  <div className="flex items-center text-gray-600">
                    <Refrigerator className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span>Eletrodomésticos de Alto Padrão</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-blue-600 mb-4">
                {property.price === 0 && property.type === 'rent' ? 'A consultar!' : `R$ ${property.price.toLocaleString('pt-BR')}${property.type === 'rent' ? '/mês' : ''}`}
              </div>
              {property.brokerPhone && (
                <a 
                  href={getWhatsAppLink(property.brokerPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Entrar em Contato
                </a>
              )}
            </div>
            {/* Contact Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Contatar Responsável</h3>
              <div className="space-y-4">
                {property.brokerPhone && (
                  <a 
                    href={`tel:${property.brokerPhone}`}
                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Phone className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{formatPhoneNumber(property.brokerPhone)}</span>
                  </a>
                )}
                {property.brokerEmail && (
                  <a 
                    href={`mailto:${property.brokerEmail}`}
                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{property.brokerEmail}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PropertyDetails;