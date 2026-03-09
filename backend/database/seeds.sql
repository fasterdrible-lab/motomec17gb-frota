-- =============================================================================
-- Seeds: 57 viaturas do 17º GB + 5 usuários
-- bcrypt hash for '123456': $2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Viaturas — 57 viaturas do 17º Grupamento de Bombeiros (SP)
-- ---------------------------------------------------------------------------
INSERT INTO viaturas (placa, prefixo, modelo, marca, ano, valor_fipe, unidade, status, km_atual) VALUES
-- 1SGB (Subgrupamento 1)
('ABC1A01','ABS-17101','Auto Bomba Simples','Mercedes-Benz',2019,285000.00,'1SGB','operacional',42350),
('ABC1B02','ABT-17102','Auto Bomba Tanque','Mercedes-Benz',2018,380000.00,'1SGB','operacional',58120),
('ABC1C03','VO-17103','Viatura de Ocorrência','Ford',2020,95000.00,'1SGB','operacional',31200),
('ABC1D04','VO-17104','Viatura de Ocorrência','Ford',2021,98000.00,'1SGB','operacional',22500),
('ABC1E05','UTI-17105','UTI Móvel','Mercedes-Benz',2022,450000.00,'1SGB','operacional',15300),
('ABC1F06','CAM-17106','Caminhão Resgate','Volvo',2017,529464.00,'1SGB','manutencao',87600),
('ABC1G07','ABS-17107','Auto Bomba Simples','Mercedes-Benz',2016,265000.00,'1SGB','operacional',96200),
('ABC1H08','VTR-17108','Viatura Tática de Resgate','Ford',2019,185000.00,'1SGB','operacional',44700),
('ABC1I09','ABT-17109','Auto Bomba Tanque','Scania',2020,412000.00,'1SGB','operacional',29800),
('ABC1J10','VO-17110','Viatura de Ocorrência','Chevrolet',2018,82000.00,'1SGB','operacional',67400),
('ABC1K11','MBT-17111','Motobomba','Honda',2021,12410.00,'1SGB','operacional',8900),
('ABC1L12','MBT-17112','Motobomba','Honda',2021,12410.00,'1SGB','operacional',7800),
('ABC1M13','AMB-17113','Ambulância Resgate','Mercedes-Benz',2020,320000.00,'1SGB','operacional',38600),
('ABC1N14','AMB-17114','Ambulância UTI','Mercedes-Benz',2022,420000.00,'1SGB','operacional',18200),
('ABC1O15','VO-17115','Viatura de Ocorrência','Ford',2017,79000.00,'1SGB','manutencao',112300),

-- 1SGB continuação
('ABC1P16','APC-17116','Auto de Primeiros Cuidados','Ford',2019,155000.00,'1SGB','operacional',51200),
('ABC1Q17','VTR-17117','Viatura Tática de Resgate','Toyota',2020,210000.00,'1SGB','operacional',33400),
('ABC1R18','ABT-17118','Auto Bomba Tanque','Mercedes-Benz',2018,375000.00,'1SGB','operacional',72100),
('ABC1S19','MBT-17119','Motobomba','Yamaha',2022,13500.00,'1SGB','operacional',5200),
('ABC1T20','CAM-17120','Caminhão Resgate Pesado','Volvo',2016,495000.00,'1SGB','operacional',98700),

-- 2SGB (Subgrupamento 2)
('ABC2A01','ABS-17201','Auto Bomba Simples','Mercedes-Benz',2020,288000.00,'2SGB','operacional',25600),
('ABC2B02','ABT-17202','Auto Bomba Tanque','Mercedes-Benz',2019,385000.00,'2SGB','operacional',47300),
('ABC2C03','VO-17203','Viatura de Ocorrência','Ford',2021,99000.00,'2SGB','operacional',19800),
('ABC2D04','VO-17204','Viatura de Ocorrência','Chevrolet',2020,86000.00,'2SGB','manutencao',63200),
('ABC2E05','UTI-17205','UTI Móvel','Mercedes-Benz',2021,445000.00,'2SGB','operacional',28900),
('ABC2F06','CAM-17206','Caminhão Resgate','Scania',2018,510000.00,'2SGB','operacional',55400),
('ABC2G07','ABS-17207','Auto Bomba Simples','Mercedes-Benz',2017,270000.00,'2SGB','operacional',88300),
('ABC2H08','VTR-17208','Viatura Tática de Resgate','Ford',2020,188000.00,'2SGB','operacional',41600),
('ABC2I09','ABT-17209','Auto Bomba Tanque','Volkswagen',2019,395000.00,'2SGB','operacional',61200),
('ABC2J10','VO-17210','Viatura de Ocorrência','Ford',2022,104000.00,'2SGB','operacional',11500),
('ABC2K11','MBT-17211','Motobomba','Honda',2020,12410.00,'2SGB','operacional',15600),
('ABC2L12','MBT-17212','Motobomba','Yamaha',2021,13200.00,'2SGB','operacional',12300),
('ABC2M13','AMB-17213','Ambulância Resgate','Mercedes-Benz',2019,315000.00,'2SGB','operacional',44100),
('ABC2N14','AMB-17214','Ambulância UTI','Ford',2021,398000.00,'2SGB','operacional',22800),
('ABC2O15','VO-17215','Viatura de Ocorrência','Toyota',2018,88000.00,'2SGB','operacional',75400),

-- 2SGB continuação
('ABC2P16','APC-17216','Auto de Primeiros Cuidados','Chevrolet',2020,148000.00,'2SGB','operacional',37800),
('ABC2Q17','VTR-17217','Viatura Tática de Resgate','Ford',2019,192000.00,'2SGB','manutencao',59700),
('ABC2R18','ABT-17218','Auto Bomba Tanque','Mercedes-Benz',2017,370000.00,'2SGB','operacional',94500),
('ABC2S19','MBT-17219','Motobomba','Honda',2022,12800.00,'2SGB','operacional',4700),
('ABC2T20','CAM-17220','Caminhão Escada','Scania',2018,480000.00,'2SGB','operacional',68300),

-- Oficina
('OFIC001','SRV-17301','Viatura de Serviço','Ford',2016,65000.00,'Oficina','operacional',103200),
('OFIC002','SRV-17302','Viatura de Serviço','Volkswagen',2017,70000.00,'Oficina','operacional',89500),
('OFIC003','REG-17303','Veículo de Regulação','Chevrolet',2019,78000.00,'Oficina','operacional',52300),
('OFIC004','SUP-17304','Veículo de Suporte','Fiat',2018,55000.00,'Oficina','inativo',135000),
('OFIC005','MEC-17305','Oficina Móvel','Mercedes-Benz',2015,220000.00,'Oficina','manutencao',142500),

-- Admin
('ADMC001','ADM-17401','Veículo Administrativo','Volkswagen',2020,95000.00,'Admin','operacional',28400),
('ADMC002','ADM-17402','Veículo Administrativo','Chevrolet',2021,98000.00,'Admin','operacional',21700),
('ADMC003','CMD-17403','Viatura de Comando','Ford',2022,125000.00,'Admin','operacional',14600),
('ADMC004','ADM-17404','Veículo Administrativo','Toyota',2019,92000.00,'Admin','operacional',45800),
('ADMC005','CMD-17405','Viatura de Comando','Mercedes-Benz',2020,280000.00,'Admin','operacional',33200),

-- Extras para completar 57
('EXTC001','ABS-17501','Auto Bomba Simples','Mercedes-Benz',2015,240000.00,'1SGB','inativo',158700),
('EXTC002','VO-17502','Viatura de Ocorrência','Ford',2016,72000.00,'2SGB','operacional',81900),
('EXTC003','ABT-17503','Auto Bomba Tanque','Scania',2021,420000.00,'1SGB','operacional',17400),
('EXTC004','AMB-17504','Ambulância Resgate','Mercedes-Benz',2021,325000.00,'2SGB','operacional',26300),
('EXTC005','UTI-17505','UTI Móvel','Ford',2020,410000.00,'Admin','operacional',31500),
('EXTC006','VTR-17506','Viatura Tática de Resgate','Toyota',2022,215000.00,'1SGB','operacional',9800),
('EXTC007','MBT-17507','Motobomba','Honda',2023,13800.00,'2SGB','operacional',2100)
ON CONFLICT (placa) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Usuários
-- Password hash for '123456'
-- ---------------------------------------------------------------------------
INSERT INTO usuarios (nome, email, cargo, unidade, senha_hash, ativo) VALUES
(
  'João Silva',
  'joao.silva@bombeiros.sp.gov.br',
  'Admin',
  '1SGB',
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  TRUE
),
(
  'Maria Santos',
  'maria.santos@bombeiros.sp.gov.br',
  'Editor',
  '2SGB',
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  TRUE
),
(
  'Carlos Costa',
  'carlos.costa@bombeiros.sp.gov.br',
  'Editor',
  '1SGB',
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  TRUE
),
(
  'Pedro Mecânico',
  'pedro.mec@bombeiros.sp.gov.br',
  'Leitor',
  'Oficina',
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  TRUE
),
(
  'José Mecânico',
  'jose.mec@bombeiros.sp.gov.br',
  'Leitor',
  'Oficina',
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Default configuracoes
-- ---------------------------------------------------------------------------
INSERT INTO configuracoes (chave, valor, descricao) VALUES
('limite_dias_oleo',    '30',  'Dias para alerta de troca de óleo'),
('limite_km_pneu',      '50000', 'KM para alerta de troca de pneu'),
('limite_dias_bateria', '365', 'Dias para alerta de troca de bateria'),
('limite_dias_inspecao','180', 'Dias para alerta de inspeção'),
('percentual_fipe_critico','60', 'Percentual de gastos vs FIPE para alerta crítico'),
('dias_aviso_antecipado','7',  'Dias de antecedência para alertas preventivos')
ON CONFLICT (chave) DO NOTHING;
