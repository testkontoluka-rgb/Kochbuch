import { IconScan, IconBook, IconTag } from './Icons.jsx';

export default function BottomTabBar({ active, onChange }) {
  const tabs = [
    { id: 'scan',       label: 'Scannen',    Icon: IconScan },
    { id: 'recipes',    label: 'Rezepte',    Icon: IconBook },
    { id: 'categories', label: 'Kategorien', Icon: IconTag  },
  ];

  return (
    <nav className="bottom-tab-bar" aria-label="Hauptnavigation">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab-btn${active === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
          aria-label={label}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
