// Ícono y color de cada tipo de entidad del tablero.
import {
  Camera,
  Crosshair,
  DoorClosed,
  DoorOpen,
  Gem,
  Lock,
  Monitor,
  Plane,
  Radiation,
  TriangleAlert,
  User,
  Vault,
  Zap,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import type { GameEntity } from '../../lib/types';

interface Props {
  entity: GameEntity;
  size: number;
}

export function EntityIcon({ entity, size }: Props) {
  const disabled = !!entity.disabledTurns;
  const enemyColor = disabled ? colors.textMuted : colors.danger;

  switch (entity.type) {
    case 'camera':
      return <Camera size={size} color={enemyColor} />;
    case 'guard':
      return <User size={size} color={enemyColor} />;
    case 'drone':
      return <Plane size={size} color={enemyColor} />;
    case 'turret':
      return <Crosshair size={size} color={enemyColor} />;
    case 'trap':
      return <TriangleAlert size={size} color={colors.suspicion} />;
    case 'door':
      return entity.open ? (
        <DoorOpen size={size} color={colors.success} />
      ) : (
        <DoorClosed size={size} color={colors.danger} />
      );
    case 'dual_door':
      return <Lock size={size} color={entity.open ? colors.success : colors.danger} />;
    case 'terminal':
      return <Monitor size={size} color={colors.stealth} />;
    case 'energy':
      return <Zap size={size} color={colors.stealth} fill={colors.stealth} />;
    case 'emp_zone':
      return <Radiation size={size} color={colors.suspicion} />;
    case 'treasure':
      return <Gem size={size} color="#FFD700" />;
    case 'vault':
      return <Vault size={size} color="#FFD700" />;
    default:
      return null;
  }
}
