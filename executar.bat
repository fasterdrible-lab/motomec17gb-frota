@echo off 
python -c "import sys; sys.path.insert(0, 'src'); from main import SistemaFrota; sistema = SistemaFrota(); sistema.teste_rapido(); sistema.executar_ciclo()" 
pause
