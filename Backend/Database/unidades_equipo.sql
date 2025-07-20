CREATE TABLE `unidades_equipo` (
  `id` int(11) NOT NULL,
  `id_equipo` int(11) NOT NULL,
  `nro_serie` varchar(100) NOT NULL,
  `id_estado` int(11) NOT NULL,
  `id_persona` int(11) DEFAULT NULL,
  `fecha_asignacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;