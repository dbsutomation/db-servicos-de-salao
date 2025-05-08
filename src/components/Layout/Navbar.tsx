
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Menu, X, LogOut, User, Edit } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { logout, currentUser, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [salonTitle, setSalonTitle] = useState('Gestão do Salão - Arquiteto Capilar');
  const inputRef = useRef<HTMLInputElement>(null);

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Only show routes the user has access to
  const getAccessibleNavLinks = () => {
    const allLinks = [
      { name: 'Início', path: '/' },
      { name: 'Serviços', path: '/services' },
      { name: 'Clientes', path: '/clients' },
      { name: 'Equipe', path: '/team' },
      { name: 'Registros', path: '/records' },
    ];
    
    if (!currentUser) return [];
    
    // Managers can see everything
    if (currentUser.isManager) return allLinks;
    
    // Non-managers can only see specific routes
    return allLinks.filter(link => 
      ['/', '/services', '/clients'].includes(link.path)
    );
  };

  const navLinks = getAccessibleNavLinks();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  // Foco no input quando iniciar a edição
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTitle]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSalonTitle(e.target.value);
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (salonTitle.trim() === '') {
      setSalonTitle('Gestão do Salão - Arquiteto Capilar');
    } else {
      toast({
        title: "Título atualizado",
        description: "O título do salão foi atualizado com sucesso."
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  // Detectar clique fora do input para salvar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditingTitle && inputRef.current && !inputRef.current.contains(event.target as Node)) {
        handleTitleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingTitle]);

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {isEditingTitle ? (
              <Input
                ref={inputRef}
                value={salonTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleSave}
                onKeyDown={handleKeyDown}
                className="text-xl font-semibold text-salon-purple max-w-xs"
              />
            ) : (
              <div className="flex items-center">
                <Link to="/" className="text-xl font-semibold text-salon-purple">
                  {salonTitle}
                </Link>
                {currentUser?.isManager && (
                  <button 
                    onClick={handleEditTitle}
                    className="ml-2 p-1 text-gray-500 hover:text-salon-purple"
                    aria-label="Editar título"
                  >
                    <Edit size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`py-2 px-1 transition-colors hover:text-salon-purple ${
                  location.pathname === link.path
                    ? 'text-salon-purple border-b-2 border-salon-purple'
                    : 'text-gray-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {currentUser && (
              <div className="flex items-center text-sm mr-2">
                <User size={16} className="mr-1" />
                <span>{currentUser.name}</span>
              </div>
            )}
            <Link to="/cart">
              <Button variant="ghost" className="relative">
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="flex items-center">
              <LogOut size={18} className="mr-1" />
              Sair
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center">
            {currentUser && (
              <div className="flex items-center text-sm mr-2">
                <User size={16} className="mr-1" />
                <span className="truncate max-w-[100px]">{currentUser.name}</span>
              </div>
            )}
            <Link to="/cart" className="mr-4 relative">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center">
                  {totalItems}
                </Badge>
              )}
            </Link>

            <Button variant="ghost" onClick={toggleMenu} className="p-1">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="flex flex-col space-y-2 pb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`py-2 px-4 rounded hover:bg-salon-light-purple ${
                    location.pathname === link.path
                      ? 'bg-salon-light-purple text-salon-purple'
                      : 'text-gray-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="justify-start py-2 px-4 text-gray-600 hover:bg-salon-light-purple"
              >
                <LogOut size={18} className="mr-2" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
