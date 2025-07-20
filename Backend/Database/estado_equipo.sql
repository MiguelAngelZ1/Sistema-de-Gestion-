CREATE TABLE `estado_equipo` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_equipo`
--

INSERT INTO `estado_equipo` (`id`, `nombre`) VALUES
(5, 'BAJA'),
(1, 'E/S En Servicio'),
(6, 'EXT Extraviado'),
(2, 'F/S Fuera de Servicio'),
(3, 'MANT Mantenimiento'),
(4, 'REPAR Reparación');