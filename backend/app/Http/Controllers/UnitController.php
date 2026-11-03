<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index()
    {
        $units = Unit::with('owner')
            ->orderBy('id', 'asc')
            ->get()
            ->unique(function ($item) {
                return trim(strtolower($item->nama)) . '|' . $item->tipe;
            })
            ->values();

        return response()->json($units);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tipe' => 'required|in:GH,Kost',
            'alamat' => 'nullable|string',
        ]);

        $unit = Unit::create($validated);
        return response()->json(['message' => 'Unit berhasil ditambahkan', 'data' => $unit], 201);
    }

    public function show(Unit $unit)
    {
        return response()->json($unit->load('owner'));
    }

    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'nama' => 'sometimes|required|string|max:255',
            'tipe' => 'sometimes|required|in:GH,Kost',
            'alamat' => 'nullable|string',
        ]);

        $unit->update($validated);
        return response()->json(['message' => 'Unit berhasil diupdate', 'data' => $unit]);
    }

    public function destroy(Unit $unit)
    {
        $unit->delete();
        return response()->json(['message' => 'Unit berhasil dihapus']);
    }
}
