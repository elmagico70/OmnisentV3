src/
├── app/                          # Configuración de la aplicación
│   ├── layout.tsx               # Layout principal
│   ├── providers.tsx            # Todos los providers
│   ├── router.tsx               # Configuración de rutas
│   └── store.ts                 # Store principal
│
├── entities/                     # Entidades de dominio (DDD)
│   ├── auth/
│   │   ├── api/                 # Funciones de API
│   │   ├── hooks/               # Hooks específicos
│   │   ├── store/               # Estado específico
│   │   ├── types/               # Types y schemas
│   │   └── index.ts             # Exports públicos
│   │
│   ├── files/
│   │   ├── api/
│   │   ├── components/          # Componentes específicos
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── notes/
│   ├── search/
│   ├── dashboard/
│   └── admin/
│
├── shared/                       # Código compartido
│   ├── api/                     # Cliente HTTP base
│   ├── components/              # Componentes reutilizables
│   │   ├── ui/                  # Componentes base (shadcn/ui)
│   │   ├── forms/               # Componentes de formularios
│   │   ├── layout/              # Componentes de layout
│   │   └── feedback/            # Loading, Error, etc.
│   │
│   ├── hooks/                   # Hooks generales
│   ├── lib/                     # Utilidades y configuraciones
│   ├── stores/                  # Stores globales
│   ├── types/                   # Types globales
│   └── constants/               # Constantes
│
├── pages/                        # Páginas principales
│   ├── dashboard/
│   ├── files/
│   ├── notes/
│   ├── search/
│   ├── admin/
│   └── auth/
│
└── widgets/                      # Componentes complejos reutilizables
    ├── file-explorer/
    ├── command-palette/
    ├── sidebar/
    └── header/